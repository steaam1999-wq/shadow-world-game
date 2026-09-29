"""Пересобирает python/iskra.py из свежей сборки сайта.

Сначала соберите сайт:  cd web && npm run build:single
Потом:                  python python/make_launcher.py
"""
import base64
import gzip
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
DIST = ROOT / 'web' / 'dist-single'
LAUNCHER = ROOT / 'python' / 'iskra.py'
TYPES = {
    'index.html': 'text/html; charset=utf-8',
    'manifest.webmanifest': 'application/manifest+json',
    'favicon.svg': 'image/svg+xml',
    'icon-192.png': 'image/png',
    'icon-512.png': 'image/png',
    'apple-touch-icon.png': 'image/png',
}


def main():
    rows = []
    for name, ctype in TYPES.items():
        packed = base64.b64encode(gzip.compress((DIST / name).read_bytes(), 9)).decode()
        rows.append(f'    {name!r}: ({ctype!r}, {packed!r}),')
    source = LAUNCHER.read_text(encoding='utf-8')
    files = 'FILES = {\n' + '\n'.join(rows) + '\n}'
    source = re.sub(r'FILES = \{\n.*?\n\}', lambda _: files, source, count=1, flags=re.S)
    LAUNCHER.write_text(source, encoding='utf-8')
    print(f'Обновлён {LAUNCHER.relative_to(ROOT)} ({LAUNCHER.stat().st_size // 1024} КБ)')


if __name__ == '__main__':
    main()
