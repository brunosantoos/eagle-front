import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Save,
  Send,
} from 'lucide-react';
import { trpc } from '../../lib/trpc';
import { useToast } from '../../context/ToastProvider';

const inCls =
  'w-full bg-eagle-black/80 border border-zinc-700/80 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 transition-colors hover:border-zinc-600 focus:outline-none focus:border-eagle-red focus:ring-2 focus:ring-eagle-red/30';
const lbCls = 'block text-xs font-medium text-zinc-300 mb-1.5 tracking-wide';

type FormState = {
  enabled: boolean;
  fromName: string;
  fromEmail: string;
  teamEmail: string;
  replyTo: string;
  siteUrl: string;
};

const EMPTY_FORM: FormState = {
  enabled: false,
  fromName: '',
  fromEmail: '',
  teamEmail: '',
  replyTo: '',
  siteUrl: '',
};


/** Passo a passo da configuração — o painel é o lugar onde a dúvida aparece. */
function SetupGuide({ domain }: { domain: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-zinc-800 bg-eagle-black/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-900/40 transition-colors"
      >
        <span className="text-sm font-heading font-semibold text-white">
          Como configurar o envio (passo a passo)
        </span>
        <ChevronDown
          size={16}
          className={`text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/80 pt-4">
          <ol className="space-y-3 list-decimal pl-4">
            <li>
              Crie uma conta em{' '}
              <a
                href="https://resend.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-eagle-gold hover:underline inline-flex items-center gap-1"
              >
                resend.com <ExternalLink size={11} />
              </a>{' '}
              (o plano gratuito cobre 3.000 e-mails por mês).
            </li>
            <li>
              Em <span className="text-zinc-200">Domains</span>, adicione{' '}
              <span className="text-zinc-200">{domain}</span>. O Resend mostra
              três registros de DNS — <span className="text-zinc-200">SPF</span>,{' '}
              <span className="text-zinc-200">DKIM</span> e{' '}
              <span className="text-zinc-200">DMARC</span>.
            </li>
            <li>
              Cadastre esses três registros no painel de DNS de quem hospeda o
              domínio e espere a verificação virar{' '}
              <span className="text-emerald-300">Verified</span> (costuma levar
              alguns minutos, pode levar até 24h).
              <p className="text-xs text-amber-200/90 mt-1.5">
                Sem esse passo o e-mail até sai, mas cai no spam — é o item que
                mais causa &quot;o cliente não recebeu&quot;.
              </p>
            </li>
            <li>
              Em <span className="text-zinc-200">API Keys</span>, crie uma chave
              com permissão de envio e cole no campo acima. A chave aparece uma
              única vez no Resend.
            </li>
            <li>
              Preencha o <span className="text-zinc-200">e-mail remetente</span>{' '}
              com um endereço do domínio verificado (ex.:{' '}
              <span className="text-zinc-200">contato@{domain}</span>) — não use
              Gmail ou Hotmail aqui, o Resend recusa.
            </li>
            <li>
              Ligue o envio, salve e use{' '}
              <span className="text-zinc-200">Enviar teste</span>. O erro que
              voltar é o erro cru do Resend:
              <ul className="list-disc pl-5 mt-1.5 space-y-1 text-xs text-zinc-500">
                <li>
                  <span className="text-zinc-300">401</span> — chave inválida ou
                  copiada pela metade.
                </li>
                <li>
                  <span className="text-zinc-300">403</span> — remetente de
                  domínio não verificado.
                </li>
                <li>
                  <span className="text-zinc-300">422</span> — algum campo de
                  e-mail vazio ou mal formatado.
                </li>
              </ul>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}

export function AdminEmailPanel() {
  const { success, error } = useToast();
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.emailSettings.get.useQuery();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  /** Vazio = mantém a chave já cadastrada (ela nunca volta do servidor). */
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testTo, setTestTo] = useState('');

  useEffect(() => {
    if (!data) return;
    setForm({
      enabled: data.enabled,
      fromName: data.fromName,
      fromEmail: data.fromEmail,
      teamEmail: data.teamEmail,
      replyTo: data.replyTo,
      siteUrl: data.siteUrl,
    });
    setTestTo((prev) => prev || data.teamEmail);
  }, [data]);

  const update = trpc.emailSettings.update.useMutation({
    onSuccess: () => {
      setApiKey('');
      void utils.emailSettings.get.invalidate();
      success('Configuração de e-mail salva.');
    },
    onError: (err) => error(err.message || 'Não foi possível salvar.'),
  });

  const sendTest = trpc.emailSettings.sendTest.useMutation({
    onSuccess: (res) => (res.ok ? success(res.message) : error(res.message)),
    onError: (err) => error(err.message || 'Falha no envio de teste.'),
  });

  const clearKey = () => {
    if (!data?.hasApiKey) return;
    update.mutate({ ...form, enabled: false, clearApiKey: true });
  };

  const save = () => {
    update.mutate({
      ...form,
      ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
    });
  };

  const patch = (next: Partial<FormState>) => setForm((f) => ({ ...f, ...next }));

  const active = Boolean(data?.hasApiKey && data.enabled);
  const sourceLabel =
    data?.apiKeySource === 'env'
      ? 'variável de ambiente do servidor'
      : data?.apiKeySource === 'panel'
        ? 'cadastrada neste painel'
        : null;

  return (
    <section className="relative overflow-hidden border border-zinc-800/80 rounded-2xl p-6 md:p-8 bg-gradient-to-b from-zinc-900/40 via-zinc-900/20 to-zinc-900/10 shadow-xl shadow-black/30">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-eagle-red/30 to-transparent" aria-hidden />

      <div className="mb-6 pb-4 border-b border-zinc-800/80 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-heading font-bold text-white tracking-tight flex items-center gap-2">
            <Mail className="text-eagle-gold shrink-0" size={20} />
            E-mail automático
          </h2>
          <p className="text-sm text-zinc-500 mt-1.5 max-w-xl">
            Confirmação para quem preenche os formulários do site e aviso para a equipe.
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
            active
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
          }`}
        >
          {active ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
          {active ? 'Envio ativo' : 'Envio desligado'}
        </span>
      </div>

      {isLoading ? (
        <p className="flex items-center gap-2 text-sm text-zinc-500 py-6">
          <Loader2 size={15} className="animate-spin" /> Carregando configuração…
        </p>
      ) : (
        <div className="space-y-5">
          {!active && (
            <p className="text-xs text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 leading-relaxed">
              Com o envio desligado os formulários continuam funcionando e os leads são gravados
              normalmente — só não sai e-mail de confirmação.
            </p>
          )}

          <SetupGuide
            domain={
              form.fromEmail.split('@')[1]?.trim() || 'eagleacademia.com.br'
            }
          />

          <div className="rounded-xl border border-zinc-800 bg-eagle-black/40 p-4 space-y-3">
            <label className={lbCls}>
              <span className="inline-flex items-center gap-1.5">
                <KeyRound size={13} className="text-eagle-gold" />
                Chave da API (Resend)
              </span>
            </label>
            {data?.hasApiKey && (
              <p className="text-xs text-zinc-400">
                Chave cadastrada:{' '}
                <span className="text-eagle-gold font-semibold">{data.apiKeyPreview}</span>
                {sourceLabel ? <span className="text-zinc-600"> · {sourceLabel}</span> : null}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  className={`${inCls} pr-10`}
                  type={showKey ? 'text' : 'password'}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={
                    data?.hasApiKey ? 'Digite para substituir a chave atual' : 're_xxxxxxxxxxxx'
                  }
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  aria-label={showKey ? 'Ocultar chave' : 'Mostrar chave'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-500 hover:text-eagle-gold transition-colors"
                >
                  {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {data?.hasApiKey && (
                <button
                  type="button"
                  onClick={clearKey}
                  disabled={update.isPending}
                  className="shrink-0 px-4 py-2.5 rounded-lg border border-zinc-700 text-xs text-zinc-300 hover:border-red-700/50 hover:text-red-300 hover:bg-red-950/20 transition-colors disabled:opacity-50"
                >
                  Remover chave
                </button>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              A chave fica só no servidor — o painel nunca mostra ela inteira. Deixe em branco para
              manter a atual. Gere em resend.com/api-keys e verifique o domínio do remetente por lá.
            </p>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) => patch({ enabled: e.target.checked })}
              className="h-4 w-4 rounded border-zinc-600 bg-eagle-black accent-red-600"
            />
            <span className="text-sm text-zinc-300">
              Enviar e-mails automáticos dos formulários
            </span>
          </label>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={lbCls}>Nome do remetente</label>
              <input
                className={inCls}
                placeholder="Eagle Center Fitness"
                value={form.fromName}
                onChange={(e) => patch({ fromName: e.target.value })}
              />
            </div>
            <div>
              <label className={lbCls}>E-mail do remetente</label>
              <input
                className={inCls}
                type="email"
                placeholder="contato@grupogoldeagle.com.br"
                value={form.fromEmail}
                onChange={(e) => patch({ fromEmail: e.target.value })}
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                Precisa ser de um domínio verificado no Resend.
              </p>
            </div>
            <div>
              <label className={lbCls}>E-mail da equipe (recebe os avisos)</label>
              <input
                className={inCls}
                type="email"
                placeholder="contato@grupogoldeagle.com.br"
                value={form.teamEmail}
                onChange={(e) => patch({ teamEmail: e.target.value })}
              />
            </div>
            <div>
              <label className={lbCls}>Responder para (opcional)</label>
              <input
                className={inCls}
                type="email"
                placeholder="Vazio = responde para quem preencheu o formulário"
                value={form.replyTo}
                onChange={(e) => patch({ replyTo: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className={lbCls}>Endereço do site (usado nos links do e-mail)</label>
              <input
                className={inCls}
                placeholder="https://eagleacademia.com.br"
                value={form.siteUrl}
                onChange={(e) => patch({ siteUrl: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-6 mt-2 border-t border-zinc-800/80">
            <div className="flex items-start gap-2 max-w-md">
              <span className="mt-0.5 h-2 w-2 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.5)] shrink-0" aria-hidden />
              <p className="text-xs text-zinc-400 leading-relaxed">
                Salve antes de testar — o teste usa a configuração já gravada.
              </p>
            </div>
            <button
              type="button"
              onClick={save}
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

          <div className="rounded-xl border border-zinc-800 bg-eagle-black/40 p-4">
            <p className="text-sm font-heading font-semibold text-eagle-light mb-1">
              Testar envio
            </p>
            <p className="text-xs text-zinc-500 mb-3">
              Manda um e-mail de teste para conferir chave e remetente.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                className={inCls}
                type="email"
                placeholder="seu@email.com"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
              />
              <button
                type="button"
                onClick={() => sendTest.mutate({ to: testTo.trim() })}
                disabled={sendTest.isPending || !testTo.trim()}
                className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-700 text-sm text-zinc-200 hover:border-eagle-gold hover:text-eagle-gold transition-colors disabled:opacity-50"
              >
                {sendTest.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                Enviar teste
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
