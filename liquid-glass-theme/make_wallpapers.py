#!/usr/bin/env python3
"""Draws the Liquid Glass theme's wallpapers: soft colour light behind glass lenses that bend it.

Each picture is a dark field of blurred colour blobs; glass shapes (circles and pills) refract that field
(stronger towards the rim, like a thick lens), are faintly frosted and tinted, catch a highlight on the
side facing the light and cast a soft shadow. The top-left (clock) and the bottom band (dock) stay calm.

    python3 make_wallpapers.py            # writes wallpapers/01-*.jpg ... into this folder
"""
import os

import numpy as np
from PIL import Image, ImageFilter

W, H = 1920, 1080
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "wallpapers")

# name, base colour, blobs (x, y, radius as fractions of H, colour), glass shapes
SCENES = [
    ("ultraviolet", (6, 6, 16), [
        (0.78, 0.30, 0.55, (124, 58, 237)),
        (0.52, 0.62, 0.45, (37, 99, 235)),
        (0.95, 0.75, 0.40, (219, 39, 119)),
        (0.30, 0.15, 0.30, (67, 56, 202)),
    ], [
        ("circle", 0.70, 0.36, 0.20, 0),
        ("pill", 0.47, 0.50, 0.30, 0.10),
        ("circle", 0.86, 0.60, 0.085, 0),
    ]),
    ("lagoon", (4, 9, 14), [
        (0.70, 0.35, 0.55, (13, 148, 136)),
        (0.45, 0.70, 0.45, (8, 145, 178)),
        (0.95, 0.20, 0.35, (30, 64, 175)),
        (0.20, 0.55, 0.30, (6, 95, 70)),
    ], [
        ("pill", 0.62, 0.32, 0.28, 0.11),
        ("circle", 0.44, 0.56, 0.13, 0),
        ("circle", 0.84, 0.58, 0.16, 0),
    ]),
    ("sunset", (12, 6, 10), [
        (0.75, 0.40, 0.50, (234, 88, 12)),
        (0.55, 0.20, 0.40, (219, 39, 119)),
        (0.92, 0.72, 0.45, (126, 34, 206)),
        (0.35, 0.65, 0.30, (190, 18, 60)),
    ], [
        ("circle", 0.62, 0.42, 0.22, 0),
        ("circle", 0.83, 0.28, 0.10, 0),
        ("pill", 0.75, 0.64, 0.15, 0.07),
    ]),
    ("aurora", (4, 8, 12), [
        (0.65, 0.25, 0.50, (16, 185, 129)),
        (0.85, 0.55, 0.45, (124, 58, 237)),
        (0.45, 0.60, 0.40, (14, 116, 144)),
        (0.25, 0.20, 0.30, (5, 150, 105)),
    ], [
        ("pill", 0.56, 0.30, 0.22, 0.075),
        ("circle", 0.74, 0.50, 0.18, 0),
        ("pill", 0.48, 0.60, 0.16, 0.055),
    ]),
]

LIGHT = np.array([-0.55, -0.83])  # highlight on the upper left of every rim


def background(base, blobs):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    img = np.zeros((H, W, 3), np.float32) + np.array(base, np.float32)
    for bx, by, br, col in blobs:
        d2 = ((xx - bx * W) ** 2 + (yy - by * H) ** 2) / (br * H) ** 2
        img += np.exp(-d2 * 1.6)[..., None] * np.array(col, np.float32) * 0.85
    # Calm zones: darker behind the clock (top left) and the dock (bottom band).
    clock = np.exp(-(((xx - 0.12 * W) / (0.35 * W)) ** 2 + ((yy - 0.12 * H) / (0.30 * H)) ** 2))
    dock = np.clip((yy / H - 0.62) / 0.38, 0, 1) ** 1.4
    img *= (1 - 0.55 * clock)[..., None]
    img *= (1 - 0.45 * dock)[..., None]
    return np.clip(img, 0, 255)


def sdf(kind, cx, cy, a, b):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    px, py = xx - cx * W, yy - cy * H
    if kind == "circle":
        return np.sqrt(px ** 2 + py ** 2) - a * H
    # pill: a = half length (fraction of W), b = radius (fraction of H)
    hx, r = a * W - b * H, b * H
    qx = np.maximum(np.abs(px) - hx, 0)
    return np.sqrt(qx ** 2 + py ** 2) - r


def sample(img, x, y):
    x = np.clip(x, 0, W - 1)
    y = np.clip(y, 0, H - 1)
    x0, y0 = np.floor(x).astype(int), np.floor(y).astype(int)
    x1, y1 = np.minimum(x0 + 1, W - 1), np.minimum(y0 + 1, H - 1)
    fx, fy = (x - x0)[..., None], (y - y0)[..., None]
    top = img[y0, x0] * (1 - fx) + img[y0, x1] * fx
    bot = img[y1, x0] * (1 - fx) + img[y1, x1] * fx
    return top * (1 - fy) + bot * fy


def blur(arr, radius):
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    return np.asarray(im.filter(ImageFilter.GaussianBlur(radius)), np.float32)


def glass(img, kind, cx, cy, a, b):
    d = sdf(kind, cx, cy, a, b)
    size = (a if kind == "circle" else b) * H          # radius of the shape's curve
    edge = size * 0.55                                  # how deep the lens bends from the rim

    # Shadow first: a soft dark copy of the shape, a little lower.
    mask = (d < 0).astype(np.float32) * 255
    sh = blur(np.roll(mask, int(size * 0.18), axis=0)[..., None].repeat(3, 2), size * 0.22)[..., 0] / 255
    img = img * (1 - 0.38 * sh)[..., None]

    gy, gx = np.gradient(d)
    n = np.sqrt(gx ** 2 + gy ** 2) + 1e-6
    nx, ny = gx / n, gy / n
    depth = np.clip(-d / edge, 0, 1)                    # 0 at the rim, 1 deep inside
    bend = (1 - depth) ** 2.2 * size * 0.55             # strongest at the rim
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    frosted = blur(img, 6)
    inside = sample(frosted, xx + nx * bend, yy + ny * bend)
    inside = inside * 1.10 + 10                          # a touch brighter, like clear glass
    inside += (1 - depth)[..., None] * 18               # brighter body towards the rim

    alpha = np.clip(0.5 - d, 0, 1)[..., None]
    out = img * (1 - alpha) + inside * alpha

    # Rim light: a thin bright line, strongest where the rim faces the light, faint on the far side.
    facing = np.clip(-(nx * LIGHT[0] + ny * LIGHT[1]), 0, 1)
    rim = np.exp(-((d + 1.5) / 1.6) ** 2)
    out += (rim * (0.25 + 0.95 * facing ** 1.5))[..., None] * 230
    # Inner sheen: a soft glow just inside the lit rim, and a faint one opposite.
    sheen = np.exp(-((d + size * 0.10) / (size * 0.07)) ** 2) * (d < 0)
    out += (sheen * (0.10 + 0.55 * facing ** 2))[..., None] * 120
    back = np.clip(nx * LIGHT[0] + ny * LIGHT[1], 0, 1)
    out += (np.exp(-((d + 3) / 3) ** 2) * back ** 2 * 0.35)[..., None] * 200
    return np.clip(out, 0, 255)


def main():
    os.makedirs(OUT, exist_ok=True)
    for i, (name, base, blobs, shapes) in enumerate(SCENES, 1):
        img = blur(background(base, blobs), 40)
        for shape in shapes:
            img = glass(img, *shape)
        # Fine grain keeps dark gradients from banding on the TV.
        img += np.random.default_rng(i).normal(0, 1.6, img.shape)
        path = os.path.join(OUT, "%02d-%s.jpg" % (i, name))
        Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(path, quality=88, optimize=True,
                                                                      progressive=True)
        print(path, os.path.getsize(path) // 1024, "KB")


if __name__ == "__main__":
    main()
