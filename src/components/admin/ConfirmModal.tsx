import { useEffect, useRef, type ReactNode } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onCancel]);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const confirmBtnClass =
    variant === 'danger'
      ? 'bg-eagle-red hover:bg-red-700 active:bg-red-800 text-white shadow-lg shadow-red-900/30 ring-1 ring-red-500/30 hover:ring-red-400/40'
      : 'bg-eagle-gold hover:brightness-110 text-eagle-black ring-1 ring-amber-300/30';

  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-[fadeIn_140ms_ease-out]"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        aria-label="Fechar"
        onClick={onCancel}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="relative w-full max-w-md rounded-2xl border border-zinc-700/80 bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-2xl shadow-black/60 outline-none animate-[modalIn_160ms_cubic-bezier(0.16,1,0.3,1)]"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-eagle-red/40 to-transparent" aria-hidden />
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 pt-10">
          <div className="flex gap-4 mb-5">
            <div
              className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center ${
                variant === 'danger'
                  ? 'bg-red-500/15 text-red-400'
                  : 'bg-eagle-gold/15 text-eagle-gold'
              }`}
            >
              <AlertTriangle size={24} strokeWidth={1.75} />
            </div>
            <div className="min-w-0 pt-1">
              <h2
                id="confirm-modal-title"
                className="text-lg font-heading font-bold text-white leading-tight"
              >
                {title}
              </h2>
              {description ? (
                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                  {description}
                </p>
              ) : null}
            </div>
          </div>
          {children}
          <div className="flex flex-col-reverse sm:flex-row gap-3 mt-8 justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-zinc-600 text-sm font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-5 py-2.5 rounded-xl text-sm font-heading font-semibold transition-colors ${confirmBtnClass}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
