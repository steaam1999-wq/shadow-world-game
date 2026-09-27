import { memo, useMemo, type CSSProperties } from 'react';

/** Rising embers and shadow motes in the background. Pure CSS, no canvas. */
export const Particles = memo(function Particles({ count = 26 }: { count?: number }) {
  const parts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const purple = i % 3 === 0;
        return {
          left: Math.random() * 100,
          size: 2 + Math.random() * 4,
          duration: 10 + Math.random() * 16,
          delay: -Math.random() * 24,
          dx: (Math.random() - 0.5) * 120,
          opacity: 0.3 + Math.random() * 0.5,
          color: purple ? 'rgba(168,85,247,0.9)' : 'rgba(239,68,68,0.9)',
        };
      }),
    [count],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {parts.map((p, i) => (
        <span
          key={i}
          className="absolute bottom-[-10px] rounded-full"
          style={
            {
              left: `${p.left}%`,
              width: p.size,
              height: p.size,
              background: p.color,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
              animation: `particle-rise ${p.duration}s linear ${p.delay}s infinite`,
              '--dx': `${p.dx}px`,
              '--o': p.opacity,
            } as CSSProperties
          }
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.75)_100%)]" />
    </div>
  );
});

/** One-shot radial burst (loot, level up). */
export function Burst({ color = '#fbbf24', count = 18 }: { color?: string; count?: number }) {
  const parts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const dist = 60 + Math.random() * 90;
        return { bx: Math.cos(angle) * dist, by: Math.sin(angle) * dist, size: 4 + Math.random() * 5, delay: Math.random() * 0.15 };
      }),
    [count],
  );
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2" aria-hidden>
      {parts.map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full"
          style={
            {
              width: p.size,
              height: p.size,
              background: color,
              boxShadow: `0 0 10px ${color}`,
              animation: `burst 0.9s ease-out ${p.delay}s both`,
              '--bx': `${p.bx}px`,
              '--by': `${p.by}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
