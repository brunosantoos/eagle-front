/// <reference types="vite/client" />
import { useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Wand2,
} from 'lucide-react';
import { trpc } from '../../lib/trpc';
import { formatBytes } from '../../lib/imageCompress';
import type { SiteMedia } from '../../lib/siteContent';
import {
  MEDIA_GROUP_ORDER,
  mediaFieldsOf,
} from '../../lib/mediaFields';
import { SectionSaveBar } from '../../components/admin/SectionSaveBar';

/**
 * Compressão do acervo já enviado — o **único** lugar onde a imagem do site é
 * recomprimida de propósito.
 *
 * O upload não mexe mais na qualidade (ver `eagle-back/src/lib/imageOptimize.ts`),
 * então comprimir passou a ser uma decisão de quem está no painel. A rotina só
 * lista o que realmente pesa: acima de 1,5 MB ou fora de escala. Nome e extensão
 * são preservados, então nenhuma referência do site quebra.
 *
 * Fluxo em dois passos de propósito: a análise mostra o que vai acontecer antes
 * de reescrever arquivo, porque a operação não tem desfazer. E é por não ter
 * desfazer que a análise virou uma **lista com seleção**: dá para comprimir uma
 * imagem só, conferir o resultado no site, e voltar para as outras depois —
 * antes o botão reescrevia o acervo inteiro de uma vez.
 */
function UploadsOptimizer() {
  type ReportFile = {
    name: string;
    before: number;
    after: number;
    resizedFrom: string | null;
  };
  type Report = {
    applied: boolean;
    files: ReportFile[];
    totalBefore: number;
    totalAfter: number;
    failed: string[];
    remoteStorage: boolean;
  };

  const sumBefore = (files: ReportFile[]) =>
    files.reduce((total, file) => total + file.before, 0);
  const sumAfter = (files: ReportFile[]) =>
    files.reduce((total, file) => total + file.after, 0);

  /** O que a análise achou e ainda não foi comprimido. */
  const [pending, setPending] = useState<Report | null>(null);
  /** Resultado da última compressão — fica na tela junto com o que sobrou. */
  const [result, setResult] = useState<Report | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  /** Nomes na rodada atual, para marcar só as linhas que estão sendo escritas. */
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const scan = trpc.mediaLibrary.scanUploads.useMutation({
    onSuccess: (data) => {
      setPending(data as Report);
      setResult(null);
      setSelected(new Set());
      setError(null);
    },
    onError: (err) => setError(err.message || 'Falha ao analisar as imagens.'),
  });

  const optimize = trpc.mediaLibrary.optimizeUploads.useMutation({
    onSuccess: (data) => {
      const done = data as Report;
      setResult(done);
      setError(null);

      // Só sai da lista o que o servidor confirmou ter reescrito. Arquivo que
      // falhou (ou que o servidor decidiu não tocar) continua selecionável.
      const written = new Set(done.files.map((file) => file.name));
      setPending((prev) => {
        if (!prev) return prev;
        const files = prev.files.filter((file) => !written.has(file.name));
        return {
          ...prev,
          files,
          totalBefore: sumBefore(files),
          totalAfter: sumAfter(files),
        };
      });
      setSelected((prev) => {
        const next = new Set(prev);
        for (const name of written) next.delete(name);
        return next;
      });
    },
    onError: (err) => setError(err.message || 'Falha ao comprimir as imagens.'),
    onSettled: () => setBusy(new Set()),
  });

  const running = scan.isPending || optimize.isPending;

  const runOptimize = (names: string[]) => {
    if (!names.length || running) return;
    setBusy(new Set(names));
    optimize.mutate({ files: names });
  };

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const pendingFiles = pending?.files ?? [];
  const allSelected =
    pendingFiles.length > 0 && selected.size === pendingFiles.length;

  const chosen = pendingFiles.filter((file) => selected.has(file.name));
  const chosenBefore = sumBefore(chosen);
  const chosenAfter = sumAfter(chosen);
  const chosenPct =
    chosenBefore > 0
      ? Math.round(((chosenBefore - chosenAfter) / chosenBefore) * 100)
      : 0;

  const resultSaved = result ? result.totalBefore - result.totalAfter : 0;
  const resultPct =
    result && result.totalBefore > 0
      ? Math.round((resultSaved / result.totalBefore) * 100)
      : 0;

  return (
    <div className="rounded-xl border border-zinc-800/70 bg-zinc-950/40 p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-heading font-semibold text-white flex items-center gap-2">
            <Wand2 size={15} className="text-eagle-gold shrink-0" />
            Comprimir imagens já enviadas
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-xl leading-relaxed">
            O upload não mexe na qualidade da sua imagem. Use isto quando o site
            estiver pesado: analise para listar as imagens acima de 1,5 MB ou
            fora de escala, <strong className="text-zinc-400">marque só as que
            quiser</strong> e comprima. O nome do arquivo é mantido, então nada
            some do site — mas a compressão não tem desfazer.
          </p>
        </div>
        <button
          type="button"
          onClick={() => scan.mutate()}
          disabled={running}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 disabled:opacity-50 transition-colors shrink-0"
        >
          {scan.isPending ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Wand2 size={13} />
          )}
          Analisar
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-400 bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {pending?.remoteStorage && (
        <p className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2 leading-relaxed">
          As mídias estão indo para um bucket externo (Armazenamento). Só os
          arquivos que ficaram no disco do servidor são processados aqui.
        </p>
      )}

      {result && (
        <p className="text-xs text-emerald-400 flex items-start gap-1.5">
          <CheckCircle2 size={12} className="mt-0.5 shrink-0" />
          {result.files.length > 0
            ? `${result.files.length} imagem(ns) comprimida(s) · ${formatBytes(result.totalBefore)} → ${formatBytes(result.totalAfter)} (-${resultPct}%)`
            : 'Nenhuma imagem foi alterada nesta passada.'}
        </p>
      )}

      {result && result.failed.length > 0 && (
        <p className="text-xs text-amber-300/90 flex items-start gap-1.5">
          <AlertTriangle size={12} className="mt-0.5 shrink-0" />
          {result.failed.length} arquivo(s) não puderam ser processados e ficaram
          como estavam.
        </p>
      )}

      {pending && pendingFiles.length === 0 && !error && (
        <p className="text-xs text-emerald-400/90">
          Nenhuma imagem para comprimir — o acervo já está otimizado.
        </p>
      )}

      {pendingFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-eagle-gold">
              {pendingFiles.length} imagem(ns) podem encolher ·{' '}
              {formatBytes(pending!.totalBefore)} →{' '}
              {formatBytes(pending!.totalAfter)}. Nada foi alterado ainda.
            </p>
            <button
              type="button"
              onClick={() =>
                setSelected(
                  allSelected
                    ? new Set()
                    : new Set(pendingFiles.map((file) => file.name)),
                )
              }
              disabled={running}
              className="text-xs text-zinc-400 hover:text-eagle-gold disabled:opacity-50 transition-colors"
            >
              {allSelected ? 'Limpar seleção' : 'Selecionar todas'}
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto rounded-lg border border-zinc-800 divide-y divide-zinc-800/70">
            {pendingFiles.map((file) => {
              const isBusy = busy.has(file.name);
              return (
                <label
                  key={file.name}
                  className={`flex items-center gap-3 px-3 py-2 text-xs cursor-pointer hover:bg-zinc-900/60 transition-colors ${
                    selected.has(file.name) ? 'bg-zinc-900/40' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(file.name)}
                    onChange={() => toggle(file.name)}
                    disabled={running}
                    className="accent-eagle-red h-3.5 w-3.5 shrink-0 cursor-pointer"
                  />
                  <span className="text-zinc-400 truncate min-w-0 flex-1">
                    {file.name}
                    {file.resizedFrom && (
                      <span className="text-zinc-600"> · {file.resizedFrom}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-zinc-500">
                    {formatBytes(file.before)}{' '}
                    <span className="text-emerald-400">
                      → {formatBytes(file.after)}
                    </span>
                  </span>
                  {/*
                    Atalho para o caso mais comum: comprimir uma imagem só, sem
                    precisar marcar a caixa antes.
                  */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      runOptimize([file.name]);
                    }}
                    disabled={running}
                    className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium bg-zinc-800 text-zinc-300 hover:bg-eagle-red hover:text-white disabled:opacity-40 transition-colors"
                  >
                    {isBusy ? (
                      <Loader2 size={11} className="animate-spin" />
                    ) : (
                      <Wand2 size={11} />
                    )}
                    Comprimir
                  </button>
                </label>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-zinc-500">
              {selected.size === 0
                ? 'Marque as imagens que quer comprimir.'
                : `${selected.size} selecionada(s) · ${formatBytes(chosenBefore)} → ${formatBytes(chosenAfter)} (-${chosenPct}%)`}
            </p>
            <button
              type="button"
              onClick={() => runOptimize([...selected])}
              disabled={running || selected.size === 0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-eagle-red hover:bg-red-700 text-white disabled:opacity-40 transition-colors"
            >
              {optimize.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <CheckCircle2 size={13} />
              )}
              {selected.size > 1
                ? `Comprimir ${selected.size} selecionadas`
                : 'Comprimir selecionada'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Biblioteca de mídias do site.
 *
 * É a visão de conjunto: todas as imagens e vídeos do site numa tela só,
 * agrupados pela página em que aparecem. **Não é mais o único lugar onde se
 * troca uma imagem** — cada campo daqui também aparece dentro da aba da sua
 * página (Sobre > Topo tem a foto do topo da Sobre), que é onde a troca
 * costuma ser decidida. Esta tela serve para conferir o acervo inteiro, para
 * o que não tem dono óbvio (logo do menu, logo do rodapé) e para a compressão.
 *
 * Os campos são desenhados pelo `renderField` do dashboard, e não por markup
 * próprio: assim o rótulo, a proporção de recorte e o comportamento do upload
 * são literalmente os mesmos dos dois lados. A versão anterior tinha um
 * formulário só seu, com um `<input type="file">` e um botão "Enviar arquivo"
 * separado — três passos para trocar uma imagem, dois deles invisíveis, e a
 * origem do "subo a imagem e não muda nada".
 */
export function AdminMediaPanel({
  renderField,
  onSave,
  dirty,
}: {
  /** Campo de mídia montado pelo dashboard (ver `mediaField` lá). */
  renderField: (key: keyof SiteMedia) => ReactNode;
  onSave: () => void;
  /** Há mídia trocada e ainda não publicada. */
  dirty?: boolean;
}) {
  return (
    <section className="border border-zinc-800/80 rounded-2xl p-6 md:p-8 bg-zinc-900/25 shadow-xl shadow-black/30">
      <div className="mb-8 pb-4 border-b border-zinc-800/80">
        <h2 className="text-xl font-heading font-bold text-white tracking-tight flex items-center gap-2">
          <ImageIcon className="text-eagle-gold shrink-0" size={22} />
          Imagens e vídeos
        </h2>
        <p className="text-sm text-zinc-500 mt-1.5 max-w-2xl leading-relaxed">
          Todas as mídias do site, agrupadas pela página onde aparecem. Cada uma
          também pode ser trocada direto na aba da própria página — o campo é o
          mesmo. As fotos dos cards de treino ficam em{' '}
          <span className="text-zinc-400">Home &gt; Carrossel</span>.
        </p>
      </div>

      <div className="space-y-12">
        {MEDIA_GROUP_ORDER.map((group) => {
          const fields = mediaFieldsOf(group);
          if (fields.length === 0) return null;
          return (
            <div key={group} className="space-y-5">
              <div className="flex items-baseline gap-2.5 pb-2 border-b border-zinc-800/60">
                <h3 className="text-sm font-heading font-semibold text-white tracking-tight">
                  {fields[0].groupLabel}
                </h3>
                <span className="text-[11px] text-zinc-600">
                  {fields.length} {fields.length === 1 ? 'arquivo' : 'arquivos'}
                </span>
              </div>
              <div className="grid gap-x-8 gap-y-8 sm:grid-cols-2 xl:grid-cols-3">
                {fields.map((field) => (
                  <div
                    key={field.key}
                    className={field.unused ? 'opacity-60' : undefined}
                  >
                    {renderField(field.key)}
                    {/*
                      Campo que o site não lê. Some da aba da página e fica só
                      aqui, sinalizado — apagar do conteúdo quebraria o save de
                      quem ainda tem o valor antigo gravado.
                    */}
                    {field.unused && (
                      <p className="text-[11px] text-amber-300/80 mt-1.5 flex items-start gap-1.5">
                        <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                        Este campo não é exibido no site hoje.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 pt-8 border-t border-zinc-800/80 space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
          Manutenção do acervo
        </p>
        <UploadsOptimizer />
      </div>

      <SectionSaveBar
        onSave={onSave}
        label="Salvar mídias no site"
        dirty={dirty}
      />
    </section>
  );
}
