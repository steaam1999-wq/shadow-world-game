// =====================================================================
//  ARCANE SURVIVORS — точка входа: логика + 2.5D рендер + HUD
// =====================================================================
import { createLogic } from './logic.js';
import { Renderer } from './render.js';
import { Hud } from './hud.js';

/* global Save */
if (!Save.data) Save.load();
const canvas = document.getElementById('game');
const logic = createLogic(canvas);
let renderer = null, hud = null;

try {
  renderer = new Renderer(canvas);
  hud = new Hud(document.getElementById('hud'), renderer);
  window.addEventListener('resize', () => renderer.resize());
} catch (err) {
  console.error(err);
  const box = document.createElement('div');
  box.className = 'webgl-error';
  box.textContent = 'Не удалось запустить WebGL. Обнови браузер или включи аппаратное ускорение.';
  document.body.appendChild(box);
}

let menuKind = 'ruins';
let last = 0;
function frame(t) {
  const real = Math.min(0.05, (t - last) / 1000 || 0);
  last = t;
  const run = logic.run;
  const active = run && !run.paused;
  if (active) {
    logic.setView(renderer.footprint.W, renderer.footprint.H);
    logic.update(real);
  }
  if (renderer) {
    renderer.render(logic.run, run ? (active ? real : 0) : real, menuKind);
    hud.draw(logic.run, logic.joy);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.Game = {
  start(ch) {
    if (renderer) renderer.reset();
    logic.start(ch);
  },
  quit() { logic.quit(); if (renderer) renderer.reset(); },
  useHeart: () => logic.useHeart(),
  applyChoice: (c) => logic.applyChoice(c),
  reroll: () => logic.reroll(),
  get rerolls() { return logic.rerolls; },
  setPaused: (v) => logic.setPaused(v),
  get running() { return logic.running; },
  get run() { return logic.run; },
  setMenuScene(kind) { menuKind = kind; },
  setView: (w, h) => logic.setView(w, h),
  get renderer() { return renderer; },
  debug: logic.debug,
};
