# 2SUB TV

An unofficial Android TV app for [2sub.movie](https://2sub.movie): the site in a full-screen WebView, made
usable with a TV remote. The site does the work (catalogue, account, player, interactive subtitles); the
app adds the TV layer.

## Remote

| Where | Key | Does |
|---|---|---|
| Pages | ← ↑ → ↓ | move the orange focus ring between links, buttons and cards |
| Pages | OK | open / press |
| Pages | Back | close a dialog, then go back a page; twice on the first page exits |
| Player | OK | pause / play |
| Player | ← → | previous / next phrase (the player's own buttons; ±10 s if they are not found) |
| Player | ↑ ↓ | menu mode: focus the player controls and the «Диалоги» panel (↓ presses «Пропустить заставку» when it shows) |
| Player | Back | leave menu mode, then close the player |
| Anywhere | ⏯ ⏪ ⏩ | play/pause, −30 s / +30 s |

Sign-in: e-mail, Yandex, Telegram and VK work inside the app. Google blocks sign-in inside apps; use e-mail.

## Build and install (Windows)

Needs JDK 17 and Android SDK platform 34, as for the CleanYourTV launcher, and network ADB on the TV.

```powershell
cd twosub-tv
powershell -ExecutionPolicy Bypass -File build-and-install.ps1 -TvHost 192.168.0.102
```

The first build downloads Gradle's dependencies and takes a few minutes. The TV asks once to allow
debugging from this computer.

## How it works

- `MainActivity.java`: the WebView (desktop user agent, cookies kept, popups for Telegram/VK sign-in,
  full-screen video, Back and media keys), no libraries.
- `assets/tv.js`: injected into every page. Spatial navigation over everything clickable (including the
  site's `cursor: pointer` cards), dialogs keep the focus, player key mapping, `window.__tv` for the app.
- `assets/tv.css`: the focus ring and small TV fixes.
- The page is laid out 1280 CSS px wide (`VIEWPORT_WIDTH` in tv.js), which is the desktop layout at about
  1.5x on a 1080p TV.

## Tuning to the site

`WebView.setWebContentsDebuggingEnabled(true)` is on: with the TV connected over ADB, open
`chrome://inspect` in Chrome on the laptop and inspect «2SUB TV» to see and edit the live page.
That is how selectors in tv.js get tuned (phrase buttons, the word-by-word subtitle mode).

## Not done yet

- Word-by-word selection in the subtitles (translate a word with OK): needs the subtitle DOM, read via
  chrome://inspect.
- Carousels that move by transform instead of scrolling may need their arrow buttons pressed by tv.js.
- Release signing and a public download page.
