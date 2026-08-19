import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';

/**
 * Painel flutuante ancorado em um botão.
 *
 * Renderiza em portal no `<body>` porque a toolbar do editor (e os cards do
 * admin) usam `overflow-hidden` — dentro deles o dropdown era cortado na borda.
 * Posição é fixa, calculada a partir do retângulo do gatilho, com inversão para
 * cima quando não cabe embaixo e limite nas bordas da janela.
 */
export function PopoverPanel({
  anchorRef,
  open,
  onClose,
  width = 232,
  ariaLabel,
  children,
}: {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  width?: number;
  ariaLabel: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }

    const place = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const panelHeight = panelRef.current?.offsetHeight ?? 260;
      const gap = 6;
      const margin = 8;

      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < panelHeight + gap + margin && rect.top > spaceBelow;

      const top = openUp
        ? Math.max(margin, rect.top - panelHeight - gap)
        : rect.bottom + gap;
      const left = Math.min(
        Math.max(margin, rect.left),
        window.innerWidth - width - margin,
      );

      setPosition({ top, left });
    };

    place();
    // Reposiciona depois da primeira medição real do painel.
    const raf = requestAnimationFrame(place);
    window.addEventListener('scroll', place, true);
    window.addEventListener('resize', place);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', place, true);
      window.removeEventListener('resize', place);
    };
  }, [open, anchorRef, width]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label={ariaLabel}
      style={{
        position: 'fixed',
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        width,
        // Enquanto a posição não foi medida, o painel fica fora da tela para não
        // piscar no canto superior esquerdo.
        visibility: position ? 'visible' : 'hidden',
        maxHeight: 'calc(100vh - 16px)',
      }}
      className="z-[300] overflow-y-auto rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl shadow-black/60"
    >
      {children}
    </div>,
    document.body,
  );
}
