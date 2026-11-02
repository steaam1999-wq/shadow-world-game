# Liquid Glass theme for the CleanYourTV launcher

Four original wallpapers of glass lenses bending soft colour light (ultraviolet, lagoon, sunset, aurora),
a new one every 30 minutes, under a translucent glass dock, glass focus highlight and icon-only buttons.
After two minutes on Home, or as the TV's screensaver, the clock drifts over the same wallpaper.

The wallpapers are drawn in code by `make_wallpapers.py` (numpy + Pillow); edit `SCENES` there for other
colours or shapes and run it again.

Push it (PowerShell, from the cleanyourtv folder):

```powershell
powershell -ExecutionPolicy Bypass -File tools\theme.ps1 -TvHost 192.168.0.102 C:\path\to\liquid-glass-theme
```
