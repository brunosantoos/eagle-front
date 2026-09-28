import { CheckCircle2, Save } from 'lucide-react';

/**
 * Barra de publicação da seção.
 *
 * `dirty` é o estado de verdade, não decoração: antes a barra dizia sempre a
 * mesma frase, então não havia como distinguir "já publiquei" de "enviei a
 * imagem e esqueci de salvar" — que era justamente onde as trocas de mídia se
 * perdiam. Com nada pendente o botão fica apagado e o texto confirma.
 */
export function SectionSaveBar({
  onSave,
  label = 'Salvar e publicar no site',
  dirty = true,
}: {
  onSave: () => void;
  label?: string;
  /** Há alteração no rascunho que este botão vai publicar. */
  dirty?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-8 mt-8 border-t border-zinc-800/80">
      <div className="flex items-start gap-2 max-w-md">
        {dirty ? (
          <>
            <span
              className="mt-0.5 h-2 w-2 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.5)] shrink-0 animate-pulse"
              aria-hidden
            />
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Há alterações não publicadas. O site só muda depois que você salvar.
            </p>
          </>
        ) : (
          <>
            <CheckCircle2
              size={14}
              className="mt-px text-emerald-400/80 shrink-0"
              aria-hidden
            />
            <p className="text-xs text-zinc-500 leading-relaxed">
              Tudo publicado — o site está igual ao que você vê aqui.
            </p>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={onSave}
        className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-heading font-semibold transition-all shrink-0 ring-1 ${
          dirty
            ? 'bg-eagle-red hover:bg-red-700 active:bg-red-800 text-white shadow-lg shadow-red-900/30 ring-red-500/30 hover:ring-red-400/40'
            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 ring-zinc-700/60'
        }`}
      >
        <Save size={18} strokeWidth={2.5} aria-hidden />
        {label}
      </button>
    </div>
  );
}
