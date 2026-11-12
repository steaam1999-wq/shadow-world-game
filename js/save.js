'use strict';
// Постоянный прогресс между забегами (localStorage)

const Save = {
  KEY: 'arcane_survivors_save_v1',
  data: null,

  defaults() {
    return {
      seenPrologue: false,
      unlockedChapter: 0,          // максимальная открытая глава
      cleared: [false, false, false, false],
      fragments: {},               // "главa-индекс": true
      ether: 0,                    // валюта Убежища
      meta: {},                    // id -> уровень
      corruption: 0,               // 0..100 — Порча
      endings: {},                 // id -> true
      runs: 0,
      deaths: 0,
      kills: 0,
      bestTime: [0, 0, 0, 0],
    };
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      this.data = Object.assign(this.defaults(), raw ? JSON.parse(raw) : {});
    } catch (e) {
      this.data = this.defaults();
    }
    return this.data;
  },

  write() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.data)); } catch (e) { /* приватный режим */ }
  },

  reset() {
    this.data = this.defaults();
    this.write();
  },

  meta(id) { return this.data.meta[id] || 0; },

  hasFragment(ch, i) { return !!this.data.fragments[ch + '-' + i]; },

  fragmentCount() { return Object.keys(this.data.fragments).length; },

  totalFragments() { return DATA.chapters.reduce((s, c) => s + c.fragments.length, 0); },

  // Открыть следующий неизвестный фрагмент главы. Возвращает {ch, i} или null
  unlockNextFragment(ch) {
    const list = DATA.chapters[ch].fragments;
    for (let i = 0; i < list.length; i++) {
      if (!this.hasFragment(ch, i)) {
        this.data.fragments[ch + '-' + i] = true;
        this.write();
        return { ch, i };
      }
    }
    return null;
  },

  addCorruption(v) {
    this.data.corruption = Math.max(0, Math.min(100, this.data.corruption + v));
    this.write();
  },
};
