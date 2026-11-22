#!/usr/bin/env python3
"""Бот для Адских Игр (Мир Теней): Монах-лекарь.
Логика: Листок Лотоса всегда, когда готов; бьёт только пока Лотос на перезарядке.
После смерти ждёт восстановления здоровья и возвращается в Адские Игры.
Пишет live/index.html (автообновление), live/screen.png и live/log.txt для наблюдения."""
import urllib.request, urllib.parse, re, time, os, html, sys
LIVE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'live')
os.makedirs(LIVE, exist_ok=True)
LOG = []
STATS = {'kills_quest': '-', 'deaths': 0, 'lotus': 0, 'hits': 0, 'start': time.strftime('%H:%M:%S')}

def g(**kw):
    try:
        return urllib.request.urlopen('http://127.0.0.1:8777/?' + urllib.parse.urlencode(kw), timeout=120).read().decode()
    except Exception as e:
        return 'ERR ' + str(e)

def links(o):
    d = {}
    if '--LINKS--' not in o: return d
    for part in o.split('--LINKS--')[1].split('|'):
        m = re.match(r'\s*(\d+):(.*)', part)
        if m: d.setdefault(m.group(2).strip(), m.group(1))
    return d

def num(s):
    s = s.strip()
    if s.endswith('M'): return float(s[:-1]) * 1e6
    if s.endswith('K'): return float(s[:-1]) * 1e3
    return float(s)

def myhp(o):
    lines = o.split('\n')
    for i, l in enumerate(lines):
        if l.strip() == 'Лорд Плоць' and i + 1 < len(lines):
            m = re.match(r'([\d.]+[KM]?) / ([\d.]+[KM]?)', lines[i + 1].strip())
            if m: return num(m.group(1)), num(m.group(2))
    m = re.match(r'\s*(\d+)', lines[1]) if len(lines) > 1 else None
    return (float(m.group(1)), None) if m else (None, None)

def log(msg):
    line = time.strftime('%H:%M:%S ') + msg
    print(line, flush=True)
    LOG.append(line); del LOG[:-200]
    with open(os.path.join(LIVE, 'log.txt'), 'a') as f: f.write(line + '\n')

def snapshot(o, mode):
    g(shot=os.path.join(LIVE, 'screen.png'))
    hp, mx = myhp(o)
    money = o.split('\n')[2].strip() if len(o.split('\n')) > 2 else ''
    page = f"""<!DOCTYPE html><html><head><meta charset=utf-8><meta http-equiv=refresh content=5>
<title>Лорд Плоць — Адские Игры</title><style>body{{background:#111;color:#ddd;font-family:sans-serif;margin:10px}}
.wrap{{display:flex;gap:16px;flex-wrap:wrap}} pre{{background:#000;padding:8px;max-height:620px;overflow:auto;font-size:12px}}
b{{color:#fc6}}</style></head><body>
<h3>Лорд Плоць — Монах-лекарь в Адских Играх</h3>
<p>Режим: <b>{html.escape(mode)}</b> · Здоровье: <b>{int(hp or 0):,} / {int(mx or 0):,}</b> · Золото/серебро: <b>{html.escape(money)}</b><br>
Лотосов: <b>{STATS['lotus']}</b> · Ударов: <b>{STATS['hits']}</b> · Смертей: <b>{STATS['deaths']}</b> · Старт: {STATS['start']} · Обновлено: {time.strftime('%H:%M:%S')}</p>
<div class=wrap><img src="screen.png?t={int(time.time())}" width=420>
<pre>{html.escape(chr(10).join(reversed(LOG[-80:])))}</pre></div></body></html>"""
    with open(os.path.join(LIVE, 'index.html'), 'w') as f: f.write(page)

CD = {'Листок Лотоса': 3.5, 'Проклятье Глайва': 6, 'Зелье здоровья': 20, 'Праздничная Пасха': 62}
last = {}
def ready(n, L): return n in L and time.time() - last.get(n, 0) > CD.get(n, 0)

def go_basin():
    o = g(go='https://m.vten.ru/basin', w=3000)
    L = links(o)
    if 'Начать бой!' in L:
        log('Вход в Адские Игры: «Начать бой!»')
        o = g(k=L['Начать бой!'], w=4000)
    return o

o = go_basin(); step = 0; last_shot = 0
while True:
    step += 1
    L = links(o); hp, mx = myhp(o)
    url = o.split('\n')[0]
    if 'Ты пал' in o or (hp is not None and hp <= 0 and 'Атаковать' in L):
        STATS['deaths'] += 1; log(f'Смерть #{STATS["deaths"]}. Выход из боя, жду восстановления здоровья.')
        if 'Покинуть бой' in L: g(k=L['Покинуть бой'], w=2500)
        while True:
            o = g(go='https://m.vten.ru/city', w=1500); h, _ = myhp(o)
            snapshot(o, f'восстановление здоровья ({int(h or 0):,})')
            if h and h >= 0.7 * 364000: break
            time.sleep(20)
        o = go_basin(); continue
    if 'Атаковать' not in L:
        if 'Начать бой!' in L:
            o = g(k=L['Начать бой!'], w=4000); continue
        if 'basin' not in url:
            o = go_basin(); continue
        o = g(w=3000); continue
    # --- бой: режим лекаря ---
    act = None
    if mx and hp < 0.35 * mx and ready('Зелье здоровья', L): act = 'Зелье здоровья'
    elif ready('Листок Лотоса', L): act = 'Листок Лотоса'
    elif ready('Праздничная Пасха', L): act = 'Праздничная Пасха'
    elif ready('Проклятье Глайва', L): act = 'Проклятье Глайва'
    else: act = 'Атаковать'
    last[act] = time.time()
    if act == 'Листок Лотоса': STATS['lotus'] += 1
    if act == 'Атаковать': STATS['hits'] += 1
    o = g(k=L[act])
    if step % 10 == 0:
        ev = [l.strip() for l in o.split('\n') if re.search(r'\d\d:\d\d$', l)][:2]
        log(f'{act:16s} hp={int(hp or 0):,} | ' + ' / '.join(ev)[:160])
    if time.time() - last_shot > 6:
        snapshot(o, 'бой — лекарь'); last_shot = time.time()
    time.sleep(0.3)
