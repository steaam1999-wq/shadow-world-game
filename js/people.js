// EMPIRE CITY — люди города: галерея, карточки, отношения, диалоги
"use strict";

// ---------- Отношения ----------
function npcSt(id) {
  if (!S.npc) S.npc = {};
  if (!S.npc[id]) S.npc[id] = { met: false, rel: npcById(id).start, talk: "", gift: "" };
  return S.npc[id];
}
const relOf = id => npcSt(id).rel;
const tierOf = v => REL_TIERS.find(t => v <= t.max);
const isFriend = id => npcMet(S, id) && relOf(id) >= 61;

function npcUnlocked(n) {
  const u = n.unlock || {};
  if (u.level && S.level < u.level) return false;
  if (u.story != null && S.story < u.story) return false;
  if (u.rel) for (const k in u.rel) if (!npcMet(S, k) || relOf(k) < u.rel[k]) return false;
  return true;
}
function unlockText(n) {
  const u = n.unlock || {}, p = [];
  if (u.story != null) p.push(u.story >= DATA.story.length ? "после Главы I" : "по сюжету «Связей»");
  if (u.level) p.push("с " + u.level + " ур.");
  if (u.rel) for (const k in u.rel) p.push("дружба с " + npcById(k).name.split(" ")[0]);
  return p.join(", ");
}

// Сумма бонусов дружбы (отношение 61+)
function perk(key) {
  if (!S || !S.npc) return 0;
  let v = 0;
  for (const n of NPCS) { const st = S.npc[n.id]; if (st && st.met && st.rel >= 61 && n.perk[key]) v += n.perk[key]; }
  return v;
}

function changeRel(id, d) {
  const st = npcSt(id), n = npcById(id);
  const wasFriend = st.met && st.rel >= 61;
  st.rel = Math.max(0, Math.min(100, st.rel + d));
  if (st.met && !wasFriend && st.rel >= 61) { addLog(`${n.name}: дружба! Бонус: ${n.perk.text}`); return `<p class="good"><b>🤝 Дружба с ${esc(n.name.split(" ")[0])}!</b><br>${n.perk.text}</p>`; }
  if (st.met && wasFriend && st.rel < 61) { addLog(`${n.name}: дружба потеряна`); return `<p class="bad">Дружба с ${esc(n.name.split(" ")[0])} потеряна — бонус отключён.</p>`; }
  return "";
}
const relDelta = (n, d) => `<span class="${d >= 0 ? "good" : "bad"}">${esc(n.name.split(" ")[0])} ${d >= 0 ? "+" : ""}${d}</span>`;
const giftPrice = () => 300 + S.level * 200;

function openNpc(id) { S._npc = id; closeModal(); go("npc"); }
function setOrg(o) { S._org = o; render(); }

function meetableCount() { return NPCS.filter(n => npcUnlocked(n) && !npcMet(S, n.id)).length; }

// ---------- Действия ----------
const PEOPLE_ACTIONS = {
  meet(id) {
    const n = npcById(id);
    if (!npcUnlocked(n) || npcMet(S, id)) return;
    modal(`<div class="portrait" style="--oc:${ORGS[n.org].color}">${ART.npc(n)}</div><h3>${n.name}</h3>
      <p class="quote left">${n.meet.text}</p>
      <div class="choices">${n.meet.options.map((o, i) => `<button class="btn choice" onclick="A.choose('${id}',${i})">${o.t}</button>`).join("")}</div>`, true);
  },
  choose(id, i) {
    const n = npcById(id), o = n.meet.options[i], st = npcSt(id);
    if (st.met) return closeModal();
    st.met = true;
    let notes = [relDelta(n, o.rel)];
    let extra = changeRel(id, o.rel);
    for (const k in (o.others || {})) { changeRel(k, o.others[k]); notes.push(relDelta(npcById(k), o.others[k])); }
    if (o.cash) { S.cash = Math.max(0, S.cash + o.cash); notes.push(`$${fmt(o.cash)}`); }
    if (o.hp) { S.hp = Math.max(1, S.hp + o.hp); notes.push(`${o.hp} ❤️`); }
    addXp(10);
    addLog(`Знакомство: ${n.name}`);
    save(); render();
    modal(`<div class="portrait" style="--oc:${ORGS[n.org].color}">${ART.npc(n)}</div><h3>${n.name}</h3>
      <p class="quote left">${o.reply}</p><p class="small">Отношения: ${notes.join(" · ")} · +10 ⭐</p>${extra}`);
  },
  talk(id) {
    const n = npcById(id), st = npcSt(id);
    if (!st.met) return;
    if (st.talk === today()) return toast("Сегодня вы уже говорили", "bad");
    if (st.rel <= 20) return toast(n.name.split(" ")[0] + " не желает с тобой разговаривать", "bad");
    st.talk = today();
    const line = n.talk[Math.floor(Math.random() * n.talk.length)];
    const extra = changeRel(id, 3);
    save(); render();
    modal(`<div class="portrait" style="--oc:${ORGS[n.org].color}">${ART.npc(n)}</div><h3>${n.name}</h3><p class="quote left">${line}</p><p class="small">Отношения: ${relDelta(n, 3)}</p>${extra}`);
  },
  gift(id) {
    const n = npcById(id), st = npcSt(id), p = giftPrice();
    if (!st.met) return;
    if (st.gift === today()) return toast("Подарок уже был сегодня", "bad");
    if (!needCash(p)) return;
    S.cash -= p; st.gift = today();
    const extra = changeRel(id, 7);
    save(); render();
    modal(`<div class="portrait" style="--oc:${ORGS[n.org].color}">${ART.npc(n)}</div><h3>🎁 Подарок</h3><p>${esc(n.name)} принимает подарок.</p><p class="small">−$${fmt(p)} · Отношения: ${relDelta(n, 7)}</p>${extra}`);
  }
};

// ---------- Карта связей ----------
function relMap(n) {
  const cx = 180, cy = 150, links = n.links, k = links.length;
  let lines = "", nodes = "";
  links.forEach(([id, label, type], i) => {
    const m = npcById(id), a = -Math.PI / 2 + i * 2 * Math.PI / k;
    const x = Math.round(cx + 128 * Math.cos(a)), y = Math.round(cy + 102 * Math.sin(a));
    const lt = LINK_TYPES[type];
    lines += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${lt.color}" stroke-width="4" stroke-linecap="round" ${type === "enemy" || type === "rival" ? 'stroke-dasharray="8 6"' : ""}/>`;
    const lock = !npcUnlocked(m);
    nodes += `<g class="mapnode${lock ? " locked" : ""}" onclick="openNpc('${id}')">
      <rect x="${x - 25}" y="${y - 27}" width="50" height="50" rx="9" fill="${ORGS[m.org].color}" stroke="${lt.color}" stroke-width="4"/>
      ${ART.inset(x - 22, y - 24, 44, 44, m.look)}
      <text x="${x}" y="${y + 36}" text-anchor="middle" class="mname">${esc(m.name.split(" ")[0])}</text>
      <text x="${x}" y="${y + 48}" text-anchor="middle" class="mlabel">${esc(label.length > 24 ? label.slice(0, 23) + "…" : label)}</text></g>`;
  });
  const center = `<rect x="${cx - 36}" y="${cy - 38}" width="72" height="72" rx="12" fill="${ORGS[n.org].color}" stroke="#2a1d12" stroke-width="4"/>${ART.inset(cx - 33, cy - 35, 66, 66, n.look)}`;
  return `<svg class="art relmap" viewBox="0 0 360 310" xmlns="http://www.w3.org/2000/svg">${lines}${center}${nodes}</svg>`;
}

function relBar(v, big) {
  const t = tierOf(v);
  return `<div class="relbar${big ? " big" : ""}"><i style="width:${v}%;background:${t.color}"></i>${big ? [20, 40, 60, 80].map(x => `<b style="left:${x}%"></b>`).join("") : ""}</div>
    <small class="reltxt" style="color:${t.color}">${t.name} · ${v}/100</small>`;
}

// ---------- Экраны ----------
const PEOPLE_SCREENS = {
  people() {
    const f = S._org || "all";
    const tabs = [["all", "Все"]].concat(Object.keys(ORGS).map(k => [k, ORGS[k].short]));
    const friends = NPCS.filter(n => isFriend(n.id)).length;
    return head("Люди города", "contacts", `${NPCS.length} персонажей · 4 организации · друзей: ${friends}`) +
      `<div class="tabs">${tabs.map(([k, t]) => `<button class="${f === k ? "on" : ""}" onclick="setOrg('${k}')">${t}</button>`).join("")}</div>` +
      Object.keys(ORGS).filter(k => f === "all" || f === k).map(k => {
        const o = ORGS[k];
        return `<div class="orgban" style="--oc:${o.color}"><span class="orgmark">${o.mark}</span><div><b>${o.name}</b><small>${o.tag}</small></div></div>
          ${f !== "all" ? `<div class="paper small">${o.text}</div>` : ""}
          <div class="npcgrid">${NPCS.filter(n => n.org === k).map(n => {
            const met = npcMet(S, n.id), unl = npcUnlocked(n);
            return `<button class="npccard${unl ? "" : " locked"}" onclick="openNpc('${n.id}')">
              ${unl && !met ? `<span class="badge new">NEW</span>` : ""}
              <div class="npcport" style="--oc:${o.color}">${ART.npc(n)}</div>
              <div class="npcinfo"><b>${n.name}</b><small>${n.title} · ${n.age}</small>
              ${met ? relBar(relOf(n.id)) : unl ? `<small class="good">Можно познакомиться</small>` : `<small>🔒 ${unlockText(n)}</small>`}</div></button>`;
          }).join("")}</div>`;
      }).join("") + `<button class="btn back" onclick="go('contacts')">← К сюжету</button>` + back();
  },

  npc() {
    const n = npcById(S._npc);
    if (!n) return PEOPLE_SCREENS.people();
    const o = ORGS[n.org], met = npcMet(S, n.id), unl = npcUnlocked(n), st = npcSt(n.id);
    const friend = met && st.rel >= 61;
    let relBlock;
    if (met) {
      relBlock = `<div class="paper"><div class="rowhead"><b>Отношение к тебе</b></div>${relBar(st.rel, true)}
        <div class="perk ${friend ? "on" : ""}">${friend ? "✅" : "🔒"} <b>Бонус дружбы:</b> ${n.perk.text}${friend ? "" : " <span class='muted'>(при 61+)</span>"}</div>
        <div class="btnrow"><button class="btn" onclick="A.talk('${n.id}')" ${st.talk === today() ? "disabled" : ""}>💬 Поговорить${st.talk === today() ? " (завтра)" : ""}</button>
        <button class="btn" onclick="A.gift('${n.id}')" ${st.gift === today() ? "disabled" : ""}>🎁 Подарок $${short(giftPrice())}</button></div></div>`;
    } else if (unl) {
      relBlock = `<div class="paper center"><p>Вы ещё не знакомы. Первое впечатление решает многое — выбирай слова.</p>
        <div class="perk">🎁 <b>Бонус дружбы:</b> ${n.perk.text}</div>
        <button class="btn green" onclick="A.meet('${n.id}')">🤝 Познакомиться</button></div>`;
    } else {
      relBlock = `<div class="paper center"><p>🔒 Знакомство откроется: <b>${unlockText(n)}</b></p><div class="perk">🎁 <b>Бонус дружбы:</b> ${n.perk.text}</div></div>`;
    }
    return topbar() + `
      <div class="npchero" style="--oc:${o.color}">
        <div class="npcfull">${ART.npcFull(n)}</div>
        <div class="npchead"><span class="orgchip">${o.mark} ${o.short}</span><h2>${n.name}</h2>
          <div>${n.title}</div><div class="muted">${n.age} лет</div>
          <div class="traits">${n.traits.map(t => `<span>${t}</span>`).join("")}</div></div>
      </div>` + relBlock + `
      <div class="paper">
        <div class="rowstat"><div class="label">Внешность:</div><div class="value">${n.looks}</div></div>
        <div class="rowstat"><div class="label">Биография:</div><div class="value">${n.bio}</div></div>
        <div class="rowstat"><div class="label">Роль в игре:</div><div class="value">${n.role}</div></div>
        <div class="rowstat"><div class="label">Связь с тобой:</div><div class="value">${n.withPlayer}</div></div>
      </div>
      <h4 class="sub">Карта связей</h4>
      <div class="paper mapbox">${relMap(n)}
        <div class="legend">${[...new Set(n.links.map(l => l[2]))].map(t => `<span><i style="background:${LINK_TYPES[t].color}"></i>${LINK_TYPES[t].name}</span>`).join("")}</div></div>
      <button class="btn back" onclick="go('people')">← Люди города</button>`;
  }
};
