# Dunes theme for the CleanYourTV launcher

Minimal sand dunes under a sky that follows the time of day: dawn and full day in the morning, sunset and
dusk in the evening, a moonlit and a deep starry night. Two pictures per part of the day, changing every
hour; a quiet rim focus, a light glass dock and icon-only buttons. The clock screensaver drifts over the
same picture.

The pictures are original, drawn in code by `make_wallpapers.py` (numpy + Pillow): edit `SCENES` for other
colours, sun positions or more layers and run it again.

```powershell
powershell -ExecutionPolicy Bypass -File tools\theme.ps1 -TvHost 192.168.0.102 C:\path\to\dunes-theme
```
