# Builds the TV home screen launcher (com.homescreen.tv), installs it on the TV over Wi-Fi ADB and makes it the home screen.
#
# Usage (PowerShell, in this folder):
#   powershell -ExecutionPolicy Bypass -File install.ps1 -TvHost 192.168.0.102
#   powershell -ExecutionPolicy Bypass -File install.ps1 -TvHost 192.168.0.102 -Restore   # back to the old launcher
#
# Needs JDK 17 and Android SDK platform 34 (the same ones CleanYourTV and 2SUB TV are built with).
param(
    [string]$TvHost = $(if ($env:TV_HOST) { $env:TV_HOST } else { '192.168.0.102' }),
    [switch]$SkipBuild,
    [switch]$Restore
)
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

$Home_ = 'com.homescreen.tv/.MainActivity'
$PrevFile = Join-Path $PSScriptRoot 'previous-home.txt'

$sdk = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "$env:LOCALAPPDATA\Android\Sdk" }

# adb: the SDK's, else the platform-tools folder in the user profile.
$adb = "$sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) { $adb = "$HOME\platform-tools\adb.exe" }
if (-not (Test-Path $adb)) { throw "adb not found ($sdk\platform-tools or $HOME\platform-tools)" }
$serial = "${TvHost}:5555"

function Adb { & $adb -s $serial @args }
function Current-Home {
    (Adb shell cmd package resolve-activity --brief -a android.intent.action.MAIN -c android.intent.category.HOME) |
        Where-Object { $_ -match '/' } | Select-Object -Last 1 | ForEach-Object { $_.Trim() }
}

& $adb connect $serial | Write-Host
Write-Host 'If the TV asks "Allow USB debugging?", tick "Always allow" and press Allow.'
& $adb -s $serial wait-for-device

if ($Restore) {
    if (-not (Test-Path $PrevFile)) { throw "No ${PrevFile} - the previous launcher was not recorded." }
    $prev = (Get-Content $PrevFile -Raw).Trim()
    Write-Host "Restoring home screen: $prev"
    Adb shell cmd package set-home-activity $prev | Write-Host
    Adb shell input keyevent KEYCODE_HOME | Out-Null
    Write-Host "Home screen is now: $(Current-Home)"
    return
}

if (-not $SkipBuild) {
    # JDK: JAVA_HOME if it is set, otherwise the Microsoft OpenJDK 17 that winget installs.
    if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
        $jdk = Get-ChildItem 'C:\Program Files\Microsoft' -Directory -Filter 'jdk-17*' -ErrorAction SilentlyContinue |
            Select-Object -First 1
        if (-not $jdk) { throw 'JDK 17 not found: winget install Microsoft.OpenJDK.17, or set JAVA_HOME' }
        $env:JAVA_HOME = $jdk.FullName
    }
    if (-not (Test-Path "$sdk\platforms\android-34")) { throw "Android SDK platform 34 not found in $sdk" }
    "sdk.dir=$($sdk -replace '\\', '\\')" | Out-File -Encoding ascii local.properties

    Write-Host 'Building...'
    .\gradlew.bat assembleDebug --console=plain
    if ($LASTEXITCODE -ne 0) { throw 'Gradle build failed' }
}
$apk = 'app\build\outputs\apk\debug\app-debug.apk'
if (-not (Test-Path $apk)) { throw "No APK at $apk" }

Write-Host 'Installing...'
Adb install -r $apk
if ($LASTEXITCODE -ne 0) { throw 'adb install failed' }

# Remember the launcher that was home before the first switch, for -Restore.
$before = Current-Home
if ($before -and $before -notmatch '^com\.homescreen\.tv/' -and -not (Test-Path $PrevFile)) {
    $before | Out-File -Encoding ascii $PrevFile
    Write-Host "Previous home screen saved: $before"
}

# Brightness for the whole screen: allow the dimming layer over other apps (TVs often have no settings page for it).
Adb shell appops set com.homescreen.tv SYSTEM_ALERT_WINDOW allow | Out-Null

Adb shell cmd package set-home-activity $Home_ | Write-Host
Adb shell input keyevent KEYCODE_HOME | Out-Null

$now = Current-Home
Write-Host ''
if ($now -match '^com\.homescreen\.tv/') {
    Write-Host 'Done: the new home screen (com.homescreen.tv) is set. Press Home on the remote.'
} else {
    Write-Host "The TV kept another home screen ($now)."
    Write-Host 'On the TV press Home; if it asks which app to use, choose the new home screen and "Always".'
}
Write-Host 'Back to the previous launcher: powershell -ExecutionPolicy Bypass -File install.ps1 -Restore'
