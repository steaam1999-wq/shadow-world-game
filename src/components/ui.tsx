import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { fmt } from '../utils/format';

export function Bar({
  value,
  max,
  color = 'from-red-500 to-red-800',
  height = 'h-3',
  label,
  lag = false,
  className = '',
}: {
  value: number;
  max: number;
  color?: string;
  height?: string;
  label?: ReactNode;
  lag?: boolean;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className={`relative w-full overflow-hidden rounded-full border border-black/60 bg-black/60 ${height} ${className}`}>
      {lag && <div className="bar-lag absolute inset-y-0 left-0 bg-white/40" style={{ width: `${pct}%` }} />}
      <div className={`bar-fill absolute inset-y-0 left-0 bg-gradient-to-r ${color}`} style={{ width: `${pct}%` }}>
        <div className="absolute inset-x-0 top-0 h-1/2 bg-white/15" />
      </div>
      {label !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white [text-shadow:0_1px_2px_#000]">
          {label}
        </div>
      )}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  children,
  title,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={`panel anim-pop-in relative max-h-[92dvh] w-full overflow-y-auto rounded-b-none p-4 sm:rounded-2xl sm:p-6 ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-4">
          <div className="title text-2xl text-zinc-100">{title}</div>
          <button className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white" onClick={onClose} aria-label="Закрыть">
            <X size={22} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Currency({ icon, value, color = 'text-zinc-100', title }: { icon: string; value: number; color?: string; title?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 font-bold tabular-nums ${color}`} title={title}>
      <span className="text-base leading-none">{icon}</span>
      {fmt(value)}
    </span>
  );
}

export function PageTitle({ icon, title, subtitle, right }: { icon: ReactNode; title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-900/60 bg-gradient-to-br from-red-950 to-black text-2xl shadow-[0_0_20px_rgba(185,28,28,0.3)]">
          {icon}
        </div>
        <div>
          <h1 className="title text-3xl leading-none text-zinc-100 sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-edge bg-black/40 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
            value === t.id ? 'bg-gradient-to-b from-red-700 to-red-950 text-white shadow-[0_0_12px_rgba(220,38,38,0.4)]' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-100'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Confirm({
  open,
  title,
  text,
  confirmLabel = 'Подтвердить',
  onConfirm,
  onClose,
  danger = true,
}: {
  open: boolean;
  title: string;
  text: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="mb-5 text-zinc-300">{text}</div>
      <div className="flex justify-end gap-2">
        <button className="btn-dark" onClick={onClose}>
          Отмена
        </button>
        <button className={danger ? 'btn-blood' : 'btn-gold'} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
