#!/usr/bin/env python3
"""Draws the Dunes theme's wallpapers: minimal layered sand dunes under a sky that follows the time of day.

Each picture is a soft sky gradient with a sun or a moon, and four to five dune ridges in front of each other.
Farther ridges fade into the haze; each ridge has a lit face and a shadow face, split by the slope of its
crest, so the dunes read as sand without any texture. The top of the picture stays plain sky for the clock.

    python3 make_wallpapers.py      # writes wallpapers/*.jpg into this folder
"""
import os

import numpy as np
from PIL import Image, ImageFilter

W, H = 1920, 1080
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "wallpapers")


def hexc(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32)


# name: sky top, sky horizon, light (sun/moon) colour, light position (x, y, radius) as fractions,
#       dune layers back to front as (lit colour, shadow colour), stars, seed
SCENES = {
    "morning-1-dawn": ("#2B3A67", "#F2B8A2", "#FFE6C7", (0.72, 0.50, 0.035), [
        ("#D9A79A", "#B98585"), ("#C98F7E", "#9C6B6E"), ("#B97A66", "#7F5459"),
        ("#9E6352", "#5E3E46"), ("#7A4A3F", "#3F2A33")], False, 3),
    "morning-2-day": ("#5B8DC9", "#F5E3C8", "#FFF8E8", (0.80, 0.22, 0.030), [
        ("#EBCB9C", "#CFA57A"), ("#E2B783", "#BF8D63"), ("#D6A169", "#A9734D"),
        ("#C88B52", "#8E5C3B"), ("#B2723F", "#6E432C")], False, 7),
    "evening-1-sunset": ("#3A2350", "#FF9E5E", "#FFD27A", (0.30, 0.47, 0.045), [
        ("#E58A5A", "#A85A4E"), ("#D27148", "#8A4643"), ("#B85A3B", "#6C3539"),
        ("#94452F", "#4E2630"), ("#6C3226", "#331A24")], False, 11),
    "evening-2-dusk": ("#1C1F45", "#C77B8E", "#FFC1A8", (0.62, 0.52, 0.030), [
        ("#9A6A86", "#6F4A6A"), ("#835873", "#573A57"), ("#6A465F", "#422C46"),
        ("#513548", "#2F2036"), ("#382433", "#1F1626")], True, 13),
    "night-1-moon": ("#050814", "#1E2C52", "#E8EEFF", (0.76, 0.24, 0.028), [
        ("#3A4A72", "#232F4E"), ("#2F3D61", "#1B2541"), ("#25314F", "#141C33"),
        ("#1B2540", "#0E1427"), ("#121A2F", "#090D1B")], True, 17),
    "night-2-deep": ("#03040B", "#14183A", "#C9D3FF", (0.22, 0.30, 0.018), [
        ("#2A2F5A", "#181C3B"), ("#232850", "#121633"), ("#1C2044", "#0E1129"),
        ("#15183A", "#0A0C21"), ("#0E1029", "#060716")], True, 19),
}


def ridge(rng, base, amp):
    x = np.linspace(0, 1, W, dtype=np.float32)
    y = np.full(W, base, np.float32)
    for f, a in ((1.3, 1.0), (2.7, 0.45), (5.1, 0.12)):
        th = 2 * np.pi * (f * x + rng.uniform(0, 1))
        y += amp * a * np.sin(th + 0.55 * np.sin(th))   # skewed: gentle windward side, steep slip face
    return y * H


def render(name, spec):
    top, horizon, light, (lx, ly, lr), layers, stars, seed = spec
    rng = np.random.default_rng(seed)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

    # Sky: top colour to horizon colour, the horizon band brightest near the light.
    t = np.clip(yy / (H * 0.62), 0, 1) ** 1.6
    img = hexc(top) * (1 - t)[..., None] + hexc(horizon) * t[..., None]
    d = np.sqrt((xx - lx * W) ** 2 + (yy - ly * H) ** 2) / H
    img += hexc(light) * (np.exp(-(d / 0.28) ** 2) * 0.35)[..., None]

    if stars:
        n = 900
        sx, sy = rng.integers(0, W, n), (rng.random(n) ** 1.8 * H * 0.55).astype(int)
        b = rng.random(n) ** 3 * 200
        starfield = np.zeros((H, W), np.float32)
        starfield[sy, sx] = b
        starfield = np.asarray(Image.fromarray(starfield.astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7)),
                               np.float32) * 1.8
        fade = np.clip(1 - yy / (H * 0.55), 0, 1)
        img += (starfield * fade)[..., None] * np.array([0.9, 0.95, 1.0])

    # The sun or the moon: a crisp disc with a soft glow.
    disc = np.clip((lr * H - d * H) / 1.5 + 0.5, 0, 1)
    img = img * (1 - disc[..., None]) + hexc(light) * disc[..., None]
    img += hexc(light) * (np.exp(-(d / (lr * 2.2)) ** 2) * 0.45)[..., None]

    # Dunes, back to front. The first ridge sits high (behind), the last low (in front).
    n = len(layers)
    haze = (hexc(horizon) + hexc(light)) / 2
    for i, (lit, shade) in enumerate(layers):
        base = 0.50 + 0.09 * i + rng.uniform(-0.015, 0.015)
        amp = 0.020 + 0.010 * i
        r = ridge(rng, base, amp)
        slope = np.gradient(r)
        k = np.exp(-np.linspace(-3, 3, 141) ** 2)
        slope = np.convolve(np.pad(slope, 70, mode="edge"), k / k.sum(), mode="valid")
        # Faces turned towards the light are lit; the sun's side decides which slope that is. The
        # boundary leans away from the light further down the face, so the shadow is a slanted wedge.
        towards = 1 if lx > 0.5 else -1
        below = yy - r[None, :]
        idx = np.clip((xx - towards * 0.9 * np.maximum(below, 0)).astype(int), 0, W - 1)
        face = 0.5 + 0.5 * np.tanh(-slope[idx] * towards * 28.0)
        mask = np.clip(below + 0.5, 0, 1)
        depth = np.clip(below / (H * 0.35), 0, 1)
        col = hexc(lit) * face[..., None] + hexc(shade) * (1 - face[..., None])
        col = col * (1 - 0.35 * depth[..., None])                      # darker further down the face
        crest = np.exp(-(below / 2.2) ** 2) * face * 0.5       # a fine bright line on lit crests
        col = col + crest[..., None] * (hexc(light) - col) * 0.6
        a = 0.55 * (1 - i / max(1, n - 1))                             # farther layers sink into the haze
        col = col * (1 - a) + haze * a
        img = img * (1 - mask[..., None]) + col * mask[..., None]

    img += rng.normal(0, 1.8, img.shape)  # grain against banding on the TV
    path = os.path.join(OUT, name + ".jpg")
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(path, quality=88, optimize=True,
                                                                  progressive=True)
    print(path, os.path.getsize(path) // 1024, "KB")


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, spec in SCENES.items():
        render(name, spec)


if __name__ == "__main__":
    main()
