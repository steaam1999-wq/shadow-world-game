#!/usr/bin/env python3
"""Собирает js/cs2-db.js из открытой базы CS2 (github.com/ByMykel/CSGO-API).

Запуск:  python3 tools/build_cs2_db.py            # скачает skins.json и crates.json
         python3 tools/build_cs2_db.py DIR        # возьмёт их из DIR

В базе: все скины CS2 (оружие, ножи, перчатки), их редкость, доступные износы,
наличие StatTrak™, ссылка на картинку Steam и ориентировочная цена, а также
официальные кейсы с реальным содержимым. Цены — оценка по редкости, оружию и
отделке, а не рыночные котировки.
"""
import hashlib
import json
import math
import os
import sys
import urllib.request

API = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'js', 'cs2-db.js')
IMG_PREFIX = 'https://community.akamai.steamstatic.com/economy/image/'


def load(name):
    if len(sys.argv) > 1:
        with open(os.path.join(sys.argv[1], name), encoding='utf-8') as f:
            return json.load(f)
    with urllib.request.urlopen(API + name) as r:
        return json.load(r)


RARITY = {
    'Consumer Grade': 'consumer', 'Industrial Grade': 'industrial', 'Mil-Spec Grade': 'milspec',
    'Restricted': 'restricted', 'Classified': 'classified', 'Covert': 'covert',
    'Extraordinary': 'rare', 'Contraband': 'contraband',
}
WEAR_BIT = {f'SFUI_InvTooltip_Wear_Amount_{i}': 1 << i for i in range(5)}  # FN, MW, FT, WW, BS
SNIPERS = {'AWP', 'SSG 08', 'SCAR-20', 'G3SG1'}
TYPE = {'Rifles': 'rifle', 'Pistols': 'pistol', 'SMGs': 'smg', 'Heavy': 'rifle',
        'Knives': 'knife', 'Gloves': 'gloves', 'Equipment': 'pistol'}

# Базовая цена (FT) по редкости.
BASE = {'consumer': 0.04, 'industrial': 0.08, 'milspec': 0.22, 'restricted': 1.1,
        'classified': 3.0, 'covert': 10.0, 'contraband': 4500.0}
WEAPON = {'AK-47': 2.6, 'AWP': 3.0, 'M4A4': 2.0, 'M4A1-S': 2.0, 'Desert Eagle': 1.6,
          'USP-S': 1.8, 'Glock-18': 1.5, 'P250': 0.8, 'Five-SeveN': 0.8, 'MP9': 0.8,
          'P90': 0.9, 'Galil AR': 0.8, 'FAMAS': 0.8, 'SSG 08': 1.0}
KNIFE = {'Karambit': 3.0, 'Butterfly Knife': 3.2, 'M9 Bayonet': 2.2, 'Talon Knife': 2.1,
         'Skeleton Knife': 2.0, 'Bayonet': 1.6, 'Stiletto Knife': 1.4, 'Classic Knife': 1.4,
         'Kukri Knife': 1.1, 'Nomad Knife': 1.1, 'Flip Knife': 1.0, 'Ursus Knife': 0.9,
         'Huntsman Knife': 0.9, 'Bowie Knife': 0.8, 'Paracord Knife': 0.8, 'Survival Knife': 0.7,
         'Falchion Knife': 0.7, 'Shadow Daggers': 0.5, 'Gut Knife': 0.5, 'Navaja Knife': 0.45}
GLOVES = {'Sport Gloves': 2.4, 'Specialist Gloves': 1.6, 'Driver Gloves': 1.1, 'Moto Gloves': 1.1,
          'Hand Wraps': 0.9, 'Hydra Gloves': 0.8, 'Broken Fang Gloves': 0.8, 'Bloodhound Gloves': 0.9}
FINISH = {'Fade': 2.2, 'Doppler': 2.0, 'Gamma Doppler': 2.2, 'Marble Fade': 2.0, 'Tiger Tooth': 1.6,
          'Lore': 2.0, 'Autotronic': 1.3, 'Crimson Web': 1.6, 'Slaughter': 1.4, 'Case Hardened': 1.3,
          'Freehand': 0.9, 'Bright Water': 0.8, 'Black Laminate': 1.0, 'Ultraviolet': 1.0,
          'Damascus Steel': 0.9, 'Blue Steel': 0.8, 'Night': 0.7, 'Night Stripe': 0.5,
          'Stained': 0.6, 'Rust Coat': 0.6, 'Urban Masked': 0.5, 'Safari Mesh': 0.45,
          'Scorched': 0.45, 'Boreal Forest': 0.45, 'Forest DDPAT': 0.45}
PHASE = {'Ruby': 5.0, 'Sapphire': 5.5, 'Black Pearl': 4.0, 'Emerald': 6.0,
         'Phase 1': 0.9, 'Phase 2': 1.2, 'Phase 3': 0.85, 'Phase 4': 1.1}

# Известные дорогие скины — ориентир по рынку, чтобы топ выглядел правдоподобно.
KNOWN = {
    'AWP | Dragon Lore': 12000, 'AWP | Gungnir': 11000, 'AK-47 | Wild Lotus': 9000,
    'M4A4 | Howl': 4500, 'AWP | Medusa': 3500, 'M4A1-S | Welcome to the Jungle': 1500,
    'AK-47 | Fire Serpent': 700, 'AWP | The Prince': 1800, 'AK-47 | Gold Arabesque': 2500,
    'M4A4 | Poseidon': 900, 'AWP | Desert Hydra': 900, 'M4A1-S | Knight': 1100,
    'M4A1-S | Printstream': 170, 'AWP | Asiimov': 130, 'AK-47 | Bloodsport': 110,
    'AK-47 | Asiimov': 70, 'AWP | Neo-Noir': 65, 'Desert Eagle | Printstream': 55,
    'USP-S | Kill Confirmed': 45, 'AWP | Hyper Beast': 30, 'AK-47 | Redline': 25,
    'AK-47 | Vulcan': 200, 'AK-47 | Case Hardened': 180, 'Desert Eagle | Blaze': 450,
    'AWP | Lightning Strike': 400, 'Glock-18 | Fade': 1400,
    '★ Sport Gloves | Pandora\'s Box': 3200, '★ Butterfly Knife | Fade': 2500,
    '★ Karambit | Fade': 1600, '★ Specialist Gloves | Crimson Kimono': 1200,
    '★ M9 Bayonet | Tiger Tooth': 950, '★ Skeleton Knife | Case Hardened': 900,
    '★ Bayonet | Marble Fade': 600, '★ Driver Gloves | King Snake': 450, '★ Flip Knife | Lore': 350,
    '★ Gut Knife | Autotronic': 180, '★ Hand Wraps | Cobalt Skulls': 160,
    '★ Shadow Daggers | Crimson Web': 140,
}

# Старые id скинов сайта → полное имя (для переноса сохранённого инвентаря).
LEGACY = {
    'p250-sand': 'P250 | Sand Dune', 'nova-pred': 'Nova | Predator', 'scar-mesh': 'SCAR-20 | Sand Mesh',
    'mag7-ddpat': 'MAG-7 | Metallic DDPAT', 'mp9-storm': 'MP9 | Storm', 'galil-sage': 'Galil AR | Sage Spray',
    'ump-urban': 'UMP-45 | Urban DDPAT', 'mp9-ruby': 'MP9 | Ruby Poison Dart', 'ump-expo': 'UMP-45 | Exposure',
    'deagle-oxide': 'Desert Eagle | Oxide Blaze', 'p250-nova': 'P250 | Supernova',
    'glock-candy': 'Glock-18 | Candy Apple', 'awp-capil': 'AWP | Capillary', 'm4a4-daimyo': 'M4A4 | Evil Daimyo',
    'ak-elite': 'AK-47 | Elite Build', 'famas-roll': 'FAMAS | Roll Cage', 'glock-water': 'Glock-18 | Water Elemental',
    'p90-asii': 'P90 | Asiimov', 'usp-cortex': 'USP-S | Cortex', 'awp-atheris': 'AWP | Atheris',
    'deagle-kumi': 'Desert Eagle | Kumicho Dragon', 'm4a1-deci': 'M4A1-S | Decimator',
    'ak-misty': 'AK-47 | Frontside Misty', 'glock-bq': 'Glock-18 | Bullet Queen', 'm4a1-hb': 'M4A1-S | Hyper Beast',
    'm4a4-deso': 'M4A4 | Desolate Space', 'ak-redline': 'AK-47 | Redline', 'awp-hb': 'AWP | Hyper Beast',
    'usp-kc': 'USP-S | Kill Confirmed', 'deagle-print': 'Desert Eagle | Printstream', 'awp-neo': 'AWP | Neo-Noir',
    'ak-asii': 'AK-47 | Asiimov', 'ak-blood': 'AK-47 | Bloodsport', 'awp-asii': 'AWP | Asiimov',
    'm4a1-print': 'M4A1-S | Printstream', 'ak-serpent': 'AK-47 | Fire Serpent',
    'm4a1-jungle': 'M4A1-S | Welcome to the Jungle', 'm4a4-howl': 'M4A4 | Howl', 'ak-lotus': 'AK-47 | Wild Lotus',
    'awp-gungnir': 'AWP | Gungnir', 'awp-dlore': 'AWP | Dragon Lore', 'daggers-web': '★ Shadow Daggers | Crimson Web',
    'wraps-cobalt': '★ Hand Wraps | Cobalt Skulls', 'gut-auto': '★ Gut Knife | Autotronic',
    'flip-lore': '★ Flip Knife | Lore', 'driver-snake': '★ Driver Gloves | King Snake',
    'bayo-marble': '★ Bayonet | Marble Fade', 'skel-ch': '★ Skeleton Knife | Case Hardened',
    'm9-tiger': '★ M9 Bayonet | Tiger Tooth', 'kara-doppler': '★ Karambit | Doppler',
    'spec-kimono': '★ Specialist Gloves | Crimson Kimono', 'kara-fade': '★ Karambit | Fade',
    'bfly-doppler': '★ Butterfly Knife | Doppler', 'bfly-fade': '★ Butterfly Knife | Fade',
    'sport-pandora': '★ Sport Gloves | Pandora\'s Box',
}


def jitter(key, lo=0.6, hi=1.8):
    """Детерминированный множитель в [lo, hi] (лог-равномерно) по имени скина."""
    h = int(hashlib.md5(key.encode()).hexdigest()[:8], 16) / 0xFFFFFFFF
    return math.exp(math.log(lo) + h * (math.log(hi) - math.log(lo)))


def price_for(s, rarity, first_year):
    full = s['name']
    weapon = s['weapon']['name']
    finish = (s.get('pattern') or {}).get('name')
    cat = s['category']['name']
    if full in KNOWN and not s.get('phase'):
        return KNOWN[full]
    if cat == 'Knives':
        p = 150 * KNIFE.get(weapon, 1.0) * FINISH.get(finish, 1.2 if finish is None else 1.0) * jitter(full, 0.8, 1.3)
        if s.get('phase'):
            p *= PHASE.get(s['phase'], 1.0)
        return p
    if cat == 'Gloves':
        return 120 * GLOVES.get(weapon, 1.0) * jitter(full, 0.5, 2.2)
    p = BASE[rarity] * WEAPON.get(weapon, 0.7) * jitter(full)
    if first_year and first_year < 2015:
        p *= 2.5
    elif first_year and first_year < 2018:
        p *= 1.4
    if s.get('souvenir') and not s.get('crates'):
        p *= 1.3
    return p


def round_price(p):
    if p >= 100:
        return round(p)
    if p >= 10:
        return round(p, 1)
    return max(0.01, round(p, 2))


def year_of(date):
    try:
        return int(str(date)[:4])
    except (TypeError, ValueError):
        return None


def main():
    skins = load('skins.json')
    crates = load('crates.json')
    case_list = [c for c in crates if c.get('type') == 'Case']
    case_year = {c['id']: year_of(c.get('first_sale_date')) for c in case_list}

    rows, index = [], {}
    for s in skins:
        rarity = 'rare' if s['category']['name'] in ('Knives', 'Gloves') else RARITY[s['rarity']['name']]
        years = [case_year[c['id']] for c in s.get('crates') or [] if case_year.get(c['id'])]
        first_year = min(years) if years else None
        weapon = s['weapon']['name']
        finish = (s.get('pattern') or {}).get('name') or 'Vanilla'
        if s.get('phase'):
            finish = f"{finish} ({s['phase']})"
        wmask = 0
        for w in s.get('wears') or []:
            wmask |= WEAR_BIT.get(w['id'], 0)
        if not wmask:
            wmask = 1  # у «ванильных» ножей нет износа — считаем «Прямо с завода»
        typ = 'sniper' if weapon in SNIPERS else TYPE[s['category']['name']]
        prefix = '★ ' if s['category']['name'] in ('Knives', 'Gloves') else ''
        img = s['image'][len(IMG_PREFIX):] if s['image'].startswith(IMG_PREFIX) else s['image']
        sid = s['id'].replace('skin-', '')
        index[s['id']] = len(rows)
        rows.append([sid, prefix + weapon, finish, typ, rarity, round_price(price_for(s, rarity, first_year)),
                     wmask, 1 if s.get('stattrak') else 0, img])

    cases = []
    for c in sorted(case_list, key=lambda c: str(c.get('first_sale_date')), reverse=True):
        items = [index[i['id']] for i in c.get('contains', []) if i['id'] in index]
        rare = [index[i['id']] for i in c.get('contains_rare', []) if i['id'] in index]
        img = c.get('image') or ''
        img = img[len(IMG_PREFIX):] if img.startswith(IMG_PREFIX) else img
        cases.append([c['id'].replace('crate-', ''), c['name'], str(c.get('first_sale_date') or ''), items, rare, img])

    by_name = {}
    for r in rows:
        name = f'{r[1]} | {r[2]}'
        by_name.setdefault(name, r[0])
        by_name.setdefault(name.split(' (')[0], r[0])  # «Doppler» без фазы → первая фаза
    legacy = {old: by_name[name] for old, name in LEGACY.items() if name in by_name}
    missing = sorted(set(LEGACY) - set(legacy))
    if missing:
        print('Не найдены в базе:', missing, file=sys.stderr)

    data = {'img': IMG_PREFIX, 'skins': rows, 'cases': cases, 'legacy': legacy}
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write('// Сгенерировано tools/build_cs2_db.py из github.com/ByMykel/CSGO-API — не редактировать вручную.\n')
        f.write('// skins: [id, оружие, отделка, тип иконки, редкость, цена FT, маска износов FN..BS, StatTrak, картинка]\n')
        f.write('// cases: [id, название, дата выхода, индексы скинов, индексы редких предметов, картинка]\n')
        f.write('window.App = window.App || {};\nwindow.App.CS2_DB = ')
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
        f.write(';\n')
    print(f'{len(rows)} скинов, {len(cases)} кейсов, {os.path.getsize(OUT) // 1024} КБ → {OUT}')


if __name__ == '__main__':
    main()
