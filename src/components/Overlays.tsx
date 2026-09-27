import { Music, Save, Trash2, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { POINTS_PER_LEVEL } from '../game/stats';
import { getUnlockedAbilities } from '../game/combat';
import { SHADOW_SLOT_LEVELS } from '../game/shadows';
import { useGame } from '../hooks/useGame';
import { Burst } from './Particles';
import { Confirm, Modal } from './ui';

const TOAST_STYLE: Record<string, string> = {
  info: 'border-zinc-600 from-zinc-900',
  success: 'border-emerald-600 from-emerald-950',
  error: 'border-red-600 from-red-950',
  achievement: 'border-amber-400 from-amber-950 shadow-[0_0_24px_rgba(245,158,11,0.45)]',
  loot: 'border-purple-500 from-purple-950',
  levelup: 'border-amber-400 from-amber-950',
};

export function Toasts() {
  const { toasts, dismissToast } = useGame();
  return (
    <div className="pointer-events-none fixed right-2 top-28 z-[70] flex w-[min(92vw,360px)] flex-col gap-2 sm:right-4 sm:top-20">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => dismissToast(t.id)}
          className={`anim-slide-in pointer-events-auto flex items-center gap-3 rounded-xl border bg-gradient-to-r to-black/95 p-3 text-left backdrop-blur ${TOAST_STYLE[t.kind]}`}
        >
          {t.icon && <span className={`text-3xl ${t.kind === 'achievement' ? 'anim-pulse-soft' : ''}`}>{t.icon}</span>}
          <div className="min-w-0">
            <div className={`text-sm font-bold ${t.kind === 'achievement' ? 'shimmer-text' : 'text-zinc-100'}`}>{t.title}</div>
            {t.text && <div className="text-xs text-zinc-400">{t.text}</div>}
          </div>
        </button>
      ))}
    </div>
  );
}

export function LevelUpOverlay() {
  const { levelUp, clearLevelUp, state } = useGame();
  useEffect(() => {
    if (levelUp === null) return;
    const t = setTimeout(clearLevelUp, 2700);
    return () => clearTimeout(t);
  }, [levelUp, clearLevelUp]);
  if (levelUp === null || !state.hero) return null;
  const newAbility = getUnlockedAbilities(state.hero.classId, levelUp).find((a) => a.unlockLevel === levelUp);
  const newSlot = SHADOW_SLOT_LEVELS.includes(levelUp) && levelUp > 1;
  return (
    <div className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(245,158,11,0.25),transparent_60%)]" />
      <div
        className="absolute left-1/2 top-1/2 h-[600px] w-[600px] opacity-40"
        style={{
          background: 'repeating-conic-gradient(from 0deg, rgba(251,191,36,0.35) 0deg 8deg, transparent 8deg 24deg)',
          animation: 'rays 8s linear infinite',
          maskImage: 'radial-gradient(circle, black 20%, transparent 65%)',
          WebkitMaskImage: 'radial-gradient(circle, black 20%, transparent 65%)',
        }}
      />
      <Burst color="#fbbf24" count={28} />
      <div className="anim-level-up relative text-center">
        <div className="title shimmer-text text-6xl drop-shadow-[0_0_30px_rgba(245,158,11,0.8)] sm:text-8xl">LEVEL UP!</div>
        <div className="title mt-2 text-3xl text-amber-200">Уровень {levelUp}</div>
        <div className="mt-2 text-sm font-semibold text-amber-100/90">+{POINTS_PER_LEVEL} очка характеристик · HP восстановлено</div>
        {newAbility && <div className="mt-2 text-lg font-bold text-purple-300">✨ Новая способность: {newAbility.name}</div>}
        {newSlot && <div className="mt-1 text-lg font-bold text-purple-300">👤 Открыт новый слот тени</div>}
      </div>
    </div>
  );
}

export function SettingsModal() {
  const { settingsOpen, setSettingsOpen, state, mutate, saveNow, resetGame, play } = useGame();
  const [confirm, setConfirm] = useState(false);
  const s = state.settings;
  const Toggle = ({ on, onClick, label, icon }: { on: boolean; onClick: () => void; label: string; icon: ReactNode }) => (
    <button onClick={onClick} className="panel-inner flex w-full items-center justify-between p-4 hover:border-zinc-500">
      <span className="flex items-center gap-3 font-semibold">
        {icon}
        {label}
      </span>
      <span className={`relative h-7 w-12 rounded-full transition ${on ? 'bg-red-600 shadow-[0_0_12px_rgba(239,68,68,0.6)]' : 'bg-zinc-700'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  );
  return (
    <>
      <Modal open={settingsOpen} onClose={() => setSettingsOpen(false)} title="⚙ Настройки">
        <div className="space-y-3">
          <Toggle
            on={s.sound}
            label={`Звук ${s.sound ? 'ON' : 'OFF'}`}
            icon={s.sound ? <Volume2 /> : <VolumeX />}
            onClick={() => {
              mutate((d) => {
                d.settings.sound = !d.settings.sound;
              });
              if (!s.sound) setTimeout(() => play('click'), 50);
            }}
          />
          <Toggle
            on={s.music}
            label={`Музыка ${s.music ? 'ON' : 'OFF'}`}
            icon={<Music />}
            onClick={() =>
              mutate((d) => {
                d.settings.music = !d.settings.music;
              })
            }
          />
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button className="btn-green" onClick={saveNow}>
              <Save size={18} /> Сохранить
            </button>
            <button className="btn-blood" onClick={() => setConfirm(true)}>
              <Trash2 size={18} /> Сброс
            </button>
          </div>
          <p className="pt-2 text-center text-xs text-zinc-500">Прогресс сохраняется автоматически в браузере (localStorage).</p>
        </div>
      </Modal>
      <Confirm
        open={confirm}
        title="Сбросить прогресс?"
        text={
          <>
            Весь прогресс будет <b className="text-red-400">безвозвратно удалён</b>: герой, предметы, тени, рейтинг арены и достижения.
          </>
        }
        confirmLabel="Удалить всё"
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          resetGame();
        }}
      />
    </>
  );
}
