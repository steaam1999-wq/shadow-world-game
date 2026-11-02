# Builds 2SUB TV and installs it on the TV over Wi-Fi ADB.
#
# Usage (PowerShell, in this folder):
#   powershell -ExecutionPolicy Bypass -File build-and-install.ps1 -TvHost 192.168.0.102
#   (or set $env:TV_HOST first and omit -TvHost)
#
# Needs JDK 17 and Android SDK platform 34 (the same ones CleanYourTV's launcher uses).
param(
    [string]$TvHost = $env:TV_HOST,
    [switch]$SkipBuild
)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
if (-not $TvHost) { throw 'Pass -TvHost <tv ip> or set $env:TV_HOST' }

# JDK: JAVA_HOME if it is set, otherwise the Microsoft OpenJDK 17 that winget installs.
if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    $jdk = Get-ChildItem 'C:\Program Files\Microsoft' -Directory -Filter 'jdk-17*' -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if (-not $jdk) { throw 'JDK 17 not found: winget install Microsoft.OpenJDK.17, or set JAVA_HOME' }
    $env:JAVA_HOME = $jdk.FullName
}

$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }
if (-not (Test-Path "$sdk\platforms\android-34")) { throw "Android SDK platform 34 not found in $sdk" }
"sdk.dir=$($sdk -replace '\\', '\\')" | Out-File -Encoding ascii local.properties

if (-not $SkipBuild) {
    Write-Host 'Building...'
    .\gradlew.bat assembleDebug --console=plain
    if ($LASTEXITCODE -ne 0) { throw 'Gradle build failed' }
}
$apk = 'app\build\outputs\apk\debug\app-debug.apk'
if (-not (Test-Path $apk)) { throw "No APK at $apk" }

$adb = "$sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) { throw "adb not found at $adb" }
$serial = "${TvHost}:5555"

& $adb connect $serial | Write-Host
Write-Host 'If the TV asks "Allow USB debugging?", tick "Always allow" and press Allow.'
& $adb -s $serial wait-for-device
& $adb -s $serial install -r $apk
if ($LASTEXITCODE -ne 0) { throw 'adb install failed' }
& $adb -s $serial shell am start -n com.twosub.tv/.MainActivity | Out-Null
Write-Host ''
Write-Host 'Installed: 2SUB TV is open on the TV and is in the app list.'
Write-Host 'Debug the page from this laptop: Chrome -> chrome://inspect -> 2SUB TV -> inspect.'
