import { useEffect, useRef, type ReactNode } from "react";
import { X, type LucideIcon } from "lucide-react";

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="section-title">
      <span>{children}</span>
    </h2>
  );
}

export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("button")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const nodes = ref.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input:not(:disabled),a[href]",
        );
        if (nodes?.length) {
          const first = nodes[0],
            last = nodes[nodes.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        ref={ref}
        className="game-dialog metal-frame"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="dialog-close round-control"
          onClick={onClose}
          aria-label="Закрыть окно"
        >
          <X size={18} />
        </button>
        <h2 className="dialog-title">{title}</h2>
        <div className="dialog-body">{children}</div>
      </section>
    </div>
  );
}

/** Иконка в металлическом круге — так 0.311 оформляет всё, для чего нет рисованного медальона. */
export function IconMedal({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="round-control icon-medal" aria-hidden="true">
      <Icon size={20} />
    </span>
  );
}
