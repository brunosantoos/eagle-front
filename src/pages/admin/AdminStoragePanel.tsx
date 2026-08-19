import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Eye,
  EyeOff,
  HardDrive,
  KeyRound,
  Loader2,
  PlugZap,
  Save,
} from 'lucide-react';
import { trpc } from '../../lib/trpc';
import { useToast } from '../../context/ToastProvider';

const inCls =
  'w-full bg-eagle-black/80 border border-zinc-700/80 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 transition-colors hover:border-zinc-600 focus:outline-none focus:border-eagle-red focus:ring-2 focus:ring-eagle-red/30';
const lbCls = 'block text-xs font-medium text-zinc-300 mb-1.5 tracking-wide';

type FormState = {
  provider: 'local' | 's3';
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  publicBaseUrl: string;
  folder: string;
  forcePathStyle: boolean;
};

const EMPTY_FORM: FormState = {
  provider: 'local',
  endpoint: '',
  region: 'us-east-1',
  bucket: '',
  accessKeyId: '',
  publicBaseUrl: '',
  folder: '',
  forcePathStyle: false,
};

export function AdminStoragePanel() {
  const { success, error } = useToast();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.storageSettings.get.useQuery();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  /** Vazio = mantém o segredo já cadastrado (ele nunca volta do servidor). */
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm({
      provider: data.provider,
      endpoint: data.endpoint,
      region: data.region,
      bucket: data.bucket,
      accessKeyId: data.accessKeyId,
      publicBaseUrl: data.publicBaseUrl,
      folder: data.folder,
      forcePathStyle: data.forcePathStyle,
    });
  }, [data]);

  const payload = () => ({
    ...form,
    ...(secret.trim() ? { secretAccessKey: secret.trim() } : {}),
  });

  const update = trpc.storageSettings.update.useMutation({
    onSuccess: () => {
      setSecret('');
      void utils.storageSettings.get.invalidate();
      success('Configuração de armazenamento salva.');
    },
    onError: (err) => error(err.message || 'Não foi possível salvar.'),
  });

  const test = trpc.storageSettings.testConnection.useMutation({
    onSuccess: (res) => (res.ok ? success(res.message) : error(res.message)),
    onError: (err) => error(err.message || 'Falha ao testar a conexão.'),
  });

  const patch = (next: Partial<FormState>) => setForm((f) => ({ ...f, ...next }));

  const usingS3 = form.provider === 's3';
  const active = Boolean(data?.configured);

  return (
    <section className="relative overflow-hidden border border-zinc-800/80 rounded-2xl p-6 md:p-8 bg-gradient-to-b from-zinc-900/40 via-zinc-900/20 to-zinc-900/10 shadow-xl shadow-black/30">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-eagle-red/30 to-transparent" aria-hidden />

      <div className="mb-6 pb-4 border-b border-zinc-800/80 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-heading font-bold text-white tracking-tight flex items-center gap-2">
            <Cloud className="text-eagle-gold shrink-0" size={20} />
            Armazenamento de mídia
          </h2>
          <p className="text-sm text-zinc-500 mt-1.5 max-w-xl">
            Onde as imagens e vídeos enviados no painel são guardados.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
            active
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-zinc-600/40 bg-zinc-500/10 text-zinc-300'
          }`}
        >
          {active ? <Cloud size={13} /> : <HardDrive size={13} />}
          {active ? 'Enviando para o bucket' : 'Salvando no servidor'}
        </span>
      </div>

      {isLoading ? (
        <p className="flex items-center gap-2 text-sm text-zinc-500 py-6">
          <Loader2 size={15} className="animate-spin" /> Carregando configuração…
        </p>
      ) : (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => patch({ provider: 'local' })}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                !usingS3
                  ? 'border-eagle-red/40 bg-eagle-red/10'
                  : 'border-zinc-800 bg-eagle-black/40 hover:border-zinc-700'
              }`}
            >
              <HardDrive size={18} className="text-eagle-gold shrink-0 mt-0.5" />
              <span>
                <span className="block text-sm font-heading font-semibold text-white">
                  Servidor (padrão)
                </span>
                <span className="block text-xs text-zinc-500 mt-1">
                  Arquivos ficam no disco da API e são servidos em /uploads.
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => patch({ provider: 's3' })}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
                usingS3
                  ? 'border-eagle-red/40 bg-eagle-red/10'
                  : 'border-zinc-800 bg-eagle-black/40 hover:border-zinc-700'
              }`}
            >
              <Cloud size={18} className="text-eagle-gold shrink-0 mt-0.5" />
              <span>
                <span className="block text-sm font-heading font-semibold text-white">
                  DigitalOcean Spaces / S3
                </span>
                <span className="block text-xs text-zinc-500 mt-1">
                  Arquivos vão para o bucket e são servidos pela CDN.
                </span>
              </span>
            </button>
          </div>

          {usingS3 && (
            <>
              <div className="rounded-xl border border-zinc-800 bg-eagle-black/40 p-4 space-y-3">
                <label className={lbCls}>
                  <span className="inline-flex items-center gap-1.5">
                    <KeyRound size={13} className="text-eagle-gold" />
                    Secret Access Key
                  </span>
                </label>
                {data?.hasSecret && (
                  <p className="text-xs text-zinc-400">
                    Segredo cadastrado:{' '}
                    <span className="text-eagle-gold font-semibold">{data.secretPreview}</span>
                    {data.secretSource === 'env' && (
                      <span className="text-zinc-600"> · variável de ambiente do servidor</span>
                    )}
                  </p>
                )}
                <div className="relative">
                  <input
                    className={`${inCls} pr-10`}
                    type={showSecret ? 'text' : 'password'}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={
                      data?.hasSecret ? 'Digite para substituir o segredo atual' : 'Segredo do Spaces'
                    }
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret((v) => !v)}
                    aria-label={showSecret ? 'Ocultar segredo' : 'Mostrar segredo'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-eagle-gold transition-colors"
                  >
                    {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Fica só no servidor — o painel nunca mostra o segredo inteiro. Deixe em branco
                  para manter o atual.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={lbCls}>Access Key ID</label>
                  <input
                    className={inCls}
                    autoComplete="off"
                    spellCheck={false}
                    value={form.accessKeyId}
                    onChange={(e) => patch({ accessKeyId: e.target.value })}
                  />
                </div>
                <div>
                  <label className={lbCls}>Bucket (nome do Space)</label>
                  <input
                    className={inCls}
                    placeholder="eagle-midias"
                    value={form.bucket}
                    onChange={(e) => patch({ bucket: e.target.value })}
                  />
                </div>
                <div>
                  <label className={lbCls}>Endpoint</label>
                  <input
                    className={inCls}
                    placeholder="https://nyc3.digitaloceanspaces.com"
                    value={form.endpoint}
                    onChange={(e) => patch({ endpoint: e.target.value })}
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Endereço da região no Spaces, sem o nome do bucket.
                  </p>
                </div>
                <div>
                  <label className={lbCls}>Região</label>
                  <input
                    className={inCls}
                    placeholder="nyc3"
                    value={form.region}
                    onChange={(e) => patch({ region: e.target.value })}
                  />
                </div>
                <div>
                  <label className={lbCls}>URL pública / CDN (opcional)</label>
                  <input
                    className={inCls}
                    placeholder="https://eagle-midias.nyc3.cdn.digitaloceanspaces.com"
                    value={form.publicBaseUrl}
                    onChange={(e) => patch({ publicBaseUrl: e.target.value })}
                  />
                  <p className="text-[11px] text-zinc-500 mt-1">
                    Vazio: a URL é montada a partir do endpoint e do bucket.
                  </p>
                </div>
                <div>
                  <label className={lbCls}>Pasta dentro do bucket (opcional)</label>
                  <input
                    className={inCls}
                    placeholder="eagle"
                    value={form.folder}
                    onChange={(e) => patch({ folder: e.target.value })}
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.forcePathStyle}
                  onChange={(e) => patch({ forcePathStyle: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-600 bg-eagle-black accent-red-600"
                />
                <span className="text-sm text-zinc-300">
                  Usar caminho no lugar de subdomínio (path-style)
                </span>
              </label>
              <p className="text-[11px] text-zinc-500 -mt-3">
                Deixe desligado no DigitalOcean Spaces. Ligue só se o serviço exigir
                endpoint/bucket/arquivo.
              </p>

              <p className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 leading-relaxed">
                Arquivos já enviados continuam onde estão — a troca vale para os próximos uploads.
                Se o envio ao bucket falhar, o arquivo é mantido no servidor para o upload não se perder.
              </p>
            </>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 border-t border-zinc-800/80">
            {usingS3 ? (
              <button
                type="button"
                onClick={() => test.mutate(payload())}
                disabled={test.isPending}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-200 hover:border-eagle-gold hover:text-eagle-gold transition-colors disabled:opacity-50"
              >
                {test.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <PlugZap size={15} />
                )}
                Testar conexão
              </button>
            ) : (
              <p className="flex items-start gap-2 text-xs text-zinc-400 leading-relaxed max-w-md">
                {active ? (
                  <CheckCircle2 size={14} className="text-emerald-300 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle size={14} className="text-zinc-500 shrink-0 mt-0.5" />
                )}
                Sem bucket configurado, tudo continua sendo salvo no servidor — que é o
                comportamento atual do site.
              </p>
            )}

            <button
              type="button"
              onClick={() => update.mutate(payload())}
              disabled={update.isPending}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-eagle-red hover:bg-red-700 active:bg-red-800 text-white text-sm font-heading font-semibold shadow-lg shadow-red-900/30 transition-all shrink-0 ring-1 ring-red-500/30 disabled:opacity-60"
            >
              {update.isPending ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} strokeWidth={2.5} />
              )}
              Salvar configuração
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
