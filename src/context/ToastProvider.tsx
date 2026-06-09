import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, X, AlertCircle } from 'lucide-react';

export type ToastVariant = 'success' | 'error';

type ToastItem = {
  id: number;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_MS = 4200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, number>>(new Map());

  const remove = useCallback((id: number) => {
    const t = timers.current.get(id);
    if (t !== undefined) window.clearTimeout(t);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (message: string, variant: ToastVariant) => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, variant }]);
      const tid = window.setTimeout(() => remove(id), TOAST_MS);
      timers.current.set(id, tid);
    },
    [remove],
  );

  const value = useMemo(
    () => ({
      success: (message: string) => push(message, 'success'),
      error: (message: string) => push(message, 'error'),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[300] flex flex-col gap-3 max-w-md w-[calc(100vw-3rem)] pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 shadow-2xl border backdrop-blur-md
              animate-[toast-in_0.35s_ease-out]
              ${
                t.variant === 'success'
                  ? 'bg-zinc-900/95 border-emerald-500/40 text-emerald-50'
                  : 'bg-zinc-900/95 border-red-500/40 text-red-50'
              }
            `}
            role="status"
          >
            {t.variant === 'success' ? (
              <CheckCircle2
                className="shrink-0 text-emerald-400 mt-0.5"
                size={20}
                strokeWidth={2}
              />
            ) : (
              <AlertCircle
                className="shrink-0 text-red-400 mt-0.5"
                size={20}
                strokeWidth={2}
              />
            )}
            <p
              className="text-sm leading-relaxed flex-1 pt-0.5"
              dangerouslySetInnerHTML={{ __html: t.message }}
            />
            <button
              type="button"
              onClick={() => remove(t.id)}
              className="shrink-0 p-1 rounded-md text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return ctx;
}
