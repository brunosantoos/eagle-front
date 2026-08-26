import { useEffect, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  Check,
  Clock,
  Copy,
  Eye,
  GripVertical,
  Mail,
  MessageSquare,
  RotateCcw,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { trpc } from '../../lib/trpc';
import { useAdminAuth } from '../../context/AdminAuthProvider';

type FranchiseStatus = 'novo' | 'contatado' | 'qualificado' | 'encerrado';
type ContactStatus = 'novo' | 'lido' | 'respondido';

const FRANCHISE_COLS: { key: FranchiseStatus; label: string; color: string }[] = [
  { key: 'novo', label: 'Novo', color: 'border-zinc-600 bg-zinc-900/40' },
  { key: 'contatado', label: 'Contatado', color: 'border-blue-700/50 bg-blue-950/20' },
  { key: 'qualificado', label: 'Qualificado', color: 'border-green-700/50 bg-green-950/20' },
  { key: 'encerrado', label: 'Encerrado', color: 'border-red-700/50 bg-red-950/20' },
];

const CONTACT_COLS: { key: ContactStatus; label: string; color: string }[] = [
  { key: 'novo', label: 'Novo', color: 'border-zinc-600 bg-zinc-900/40' },
  { key: 'lido', label: 'Lido', color: 'border-blue-700/50 bg-blue-950/20' },
  { key: 'respondido', label: 'Respondido', color: 'border-green-700/50 bg-green-950/20' },
];

/**
 * Prazo de resposta. Passou disso sem responder, a mensagem aparece como
 * "em atraso" — o estado é calculado, não guardado: depende do relógio, e um
 * valor gravado ficaria velho sozinho.
 */
const RESPONSE_SLA_DAYS = 5;

/** Espelha `TRASH_RETENTION_DAYS` do backend (`eagle-back/src/lib/trash.ts`). */
const TRASH_RETENTION_DAYS = 30;

/** Dias inteiros decorridos desde a data. */
function daysSince(d: Date | string): number {
  const then = new Date(d).getTime();
  return Math.max(0, Math.floor((Date.now() - then) / (24 * 60 * 60 * 1000)));
}

/** 'hoje' | 'ontem' | 'há 10 dias' — o cronômetro pedido no card. */
function formatAge(d: Date | string): string {
  const days = daysSince(d);
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  return `há ${days} dias`;
}

type ResponseState = {
  key: 'respondido' | 'a-responder' | 'em-atraso';
  label: string;
  className: string;
};

/**
 * Situação de resposta de uma mensagem, derivada do status e da idade.
 *
 * Campos opcionais porque o tsconfig do submodule do backend não liga `strict`
 * e os tipos que chegam pelo tRPC vêm todos como opcionais.
 */
function responseState(contact: {
  status?: string;
  createdAt?: Date | string;
}): ResponseState {
  if (contact.status === 'respondido') {
    return {
      key: 'respondido',
      label: 'Respondido',
      className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    };
  }
  const days = contact.createdAt ? daysSince(contact.createdAt) : 0;
  if (days >= RESPONSE_SLA_DAYS) {
    return {
      key: 'em-atraso',
      label: `Em atraso — ${days} dias sem resposta`,
      className: 'bg-red-500/15 text-red-300 border-red-500/30',
    };
  }
  return {
    key: 'a-responder',
    label: 'A responder',
    className: 'bg-amber-500/15 text-amber-200 border-amber-500/30',
  };
}

/** Etiqueta de idade usada nos cards do quadro. */
function AgeBadge({ date, late }: { date: Date | string; late?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] rounded-full px-1.5 py-0.5 border ${
        late
          ? 'bg-red-500/15 text-red-300 border-red-500/30'
          : 'bg-zinc-800 text-zinc-400 border-zinc-700'
      }`}
      title={`Recebido ${formatAge(date)}`}
    >
      <Clock size={10} />
      {formatAge(date)}
    </span>
  );
}

/** Copia texto e devolve feedback curto — usado no e-mail do contato. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard
          ?.writeText(value)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          })
          .catch(() => {
            /* sem permissão de área de transferência */
          });
      }}
      title={copied ? 'Copiado' : label}
      aria-label={label}
      className="shrink-0 p-1 rounded text-zinc-500 hover:text-eagle-gold transition-colors"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('pt-BR');
}

function formatDateTime(d: Date | string) {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Link mailto já com assunto e saudação preenchidos. */
function mailtoLink(email: string, subject: string, greetingName: string) {
  const body = `Olá ${greetingName},\n\n`;
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[132px_1fr] gap-1 sm:gap-3 py-2.5 border-b border-zinc-800/70">
      <p className="text-xs text-zinc-500">{label}</p>
      <div className="text-sm text-zinc-200 break-words">{children}</div>
    </div>
  );
}

/**
 * Modal de leitura — o kanban mostra só um resumo truncado, então a equipe
 * precisava de um lugar para ler a mensagem inteira e responder.
 */
function DetailModal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-[fadeIn_140ms_ease-out]">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/60 animate-[modalIn_160ms_ease-out]"
      >
        <div className="flex items-start justify-between gap-4 p-5 border-b border-zinc-800/80">
          <div className="min-w-0">
            <h3 className="text-lg font-heading font-bold text-white truncate">{title}</h3>
            {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && (
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 p-5 border-t border-zinc-800/80">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Franchise Kanban ---
function FranchiseKanban() {
  const utils = trpc.useUtils();
  const { data: leads = [] } = trpc.franchiseLeads.list.useQuery();
  const updateStatus = trpc.franchiseLeads.updateStatus.useMutation({
    onMutate: async (vars) => {
      const { id, status } = vars as { id: string; status: FranchiseStatus };
      await utils.franchiseLeads.list.cancel();
      const prev = utils.franchiseLeads.list.getData();
      utils.franchiseLeads.list.setData(undefined, (old) =>
        old?.map((l) => (l.id === id ? { ...l, status } : l)) ?? old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.franchiseLeads.list.setData(undefined, ctx.prev);
    },
    onSettled: () => utils.franchiseLeads.list.invalidate(),
  });
  const updateNotes = trpc.franchiseLeads.updateNotes.useMutation({
    onSuccess: () => utils.franchiseLeads.list.invalidate(),
  });
  const deleteLead = trpc.franchiseLeads.delete.useMutation({
    onSuccess: () => {
      void utils.franchiseLeads.list.invalidate();
      // Some do quadro e aparece na lixeira — as duas listas mudam.
      void utils.franchiseLeads.listDeleted.invalidate();
    },
  });
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<FranchiseStatus | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = leads.find((l) => l.id === detailId) ?? null;

  const onDrop = (status: FranchiseStatus) => {
    setDragOverCol(null);
    if (!draggingId) return;
    const lead = leads.find((l) => l.id === draggingId);
    setDraggingId(null);
    if (!lead || lead.status === status) return;
    updateStatus.mutate({ id: lead.id, status });
  };

  return (
    <>
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
      {FRANCHISE_COLS.map(col => {
        const cards = leads.filter(l => l.status === col.key);
        const isOver = dragOverCol === col.key;
        return (
          <div
            key={col.key}
            onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.key); }}
            onDragLeave={() => setDragOverCol((c) => (c === col.key ? null : c))}
            onDrop={() => onDrop(col.key)}
            className={`flex-shrink-0 w-72 rounded-2xl border ${col.color} p-4 flex flex-col gap-3 transition-colors ${isOver ? 'ring-2 ring-eagle-red/60' : ''}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-heading font-semibold text-white text-sm">{col.label}</span>
              <span className="text-xs bg-zinc-800 text-zinc-300 rounded-full px-2 py-0.5">{cards.length}</span>
            </div>
            {cards.length === 0 && (
              <p className="text-xs text-zinc-600 text-center py-6 border border-dashed border-zinc-800 rounded-xl">
                {isOver ? 'Solte aqui' : 'Nenhum lead'}
              </p>
            )}
            {cards.map(lead => (
              <div
                key={lead.id}
                draggable
                onDragStart={(e) => {
                  setDraggingId(lead.id);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', lead.id);
                }}
                onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
                className={`bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 space-y-2 cursor-grab active:cursor-grabbing transition-opacity ${draggingId === lead.id ? 'opacity-40' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-1.5 min-w-0">
                    <GripVertical size={14} className="text-zinc-600 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm truncate">{lead.name}</p>
                      <p className="text-xs text-zinc-400 truncate">{lead.email}</p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDetailId(lead.id)}
                      title="Ver detalhes"
                      aria-label={`Ver detalhes de ${lead.name}`}
                      className="text-zinc-600 hover:text-eagle-gold transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteLead.mutate({ id: lead.id })}
                      title="Mover para a lixeira"
                      aria-label={`Mover ${lead.name} para a lixeira`}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-zinc-500 space-y-0.5">
                  <p>{lead.phone}</p>
                  <p>{lead.city}</p>
                  <p className="text-zinc-600">{lead.capital}</p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-zinc-700">{formatDate(lead.createdAt)}</span>
                    <AgeBadge date={lead.createdAt} />
                  </div>
                </div>
                <textarea
                  className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-eagle-red resize-none"
                  rows={2}
                  placeholder="Anotações..."
                  value={editingNotes[lead.id] ?? lead.notes}
                  onChange={e => setEditingNotes(p => ({ ...p, [lead.id]: e.target.value }))}
                  onBlur={() => {
                    const notes = editingNotes[lead.id];
                    if (notes !== undefined && notes !== lead.notes) {
                      updateNotes.mutate({ id: lead.id, notes });
                    }
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>

    <DetailModal
      open={detail !== null}
      title={detail?.name ?? ''}
      subtitle={
        detail
          ? `Lead de franquia · recebido em ${formatDateTime(detail.createdAt)} (${formatAge(detail.createdAt)})`
          : undefined
      }
      onClose={() => setDetailId(null)}
      footer={
        detail ? (
          <>
            <a
              href={mailtoLink(
                detail.email,
                'Franquia Eagle Center Fitness',
                detail.name.split(' ')[0] ?? detail.name,
              )}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-eagle-red hover:bg-red-700 text-white text-sm font-heading font-semibold transition-colors"
            >
              <Mail size={15} />
              Responder por e-mail
            </a>
            <button
              type="button"
              onClick={() => setDetailId(null)}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-900 transition-colors"
            >
              Fechar
            </button>
          </>
        ) : null
      }
    >
      {detail && (
        <div className="space-y-1">
          <DetailRow label="E-mail">
            <span className="inline-flex items-center gap-1.5">
              <a href={`mailto:${detail.email}`} className="text-eagle-gold hover:underline">
                {detail.email}
              </a>
              {/* Sem app de e-mail padrão o `mailto:` não abre nada — daí o copiar. */}
              <CopyButton value={detail.email} label="Copiar e-mail" />
            </span>
          </DetailRow>
          <DetailRow label="Telefone">
            {detail.phone ? (
              <a href={`tel:${detail.phone.replace(/[^+\d]/g, '')}`} className="text-eagle-gold hover:underline">
                {detail.phone}
              </a>
            ) : (
              <span className="text-zinc-500">—</span>
            )}
          </DetailRow>
          <DetailRow label="Cidade/Estado">{detail.city || '—'}</DetailRow>
          <DetailRow label="Capital disponível">{detail.capital || '—'}</DetailRow>
          <DetailRow label="Status">
            {FRANCHISE_COLS.find((c) => c.key === detail.status)?.label ?? detail.status}
          </DetailRow>
          <DetailRow label="Anotações">
            <textarea
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-eagle-red resize-y min-h-[80px]"
              placeholder="Anotações internas..."
              value={editingNotes[detail.id] ?? detail.notes}
              onChange={(e) =>
                setEditingNotes((prev) => ({ ...prev, [detail.id]: e.target.value }))
              }
              onBlur={() => {
                const notes = editingNotes[detail.id];
                if (notes !== undefined && notes !== detail.notes) {
                  updateNotes.mutate({ id: detail.id, notes });
                }
              }}
            />
          </DetailRow>
        </div>
      )}
    </DetailModal>
    </>
  );
}

// --- Contact Kanban ---
function ContactKanban() {
  const utils = trpc.useUtils();
  const { data: contacts = [] } = trpc.contactSubmissions.list.useQuery();
  const updateStatus = trpc.contactSubmissions.updateStatus.useMutation({
    onMutate: async (vars) => {
      const { id, status } = vars as { id: string; status: ContactStatus };
      await utils.contactSubmissions.list.cancel();
      const prev = utils.contactSubmissions.list.getData();
      utils.contactSubmissions.list.setData(undefined, (old) =>
        old?.map((c) => (c.id === id ? { ...c, status } : c)) ?? old
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.contactSubmissions.list.setData(undefined, ctx.prev);
    },
    onSettled: () => utils.contactSubmissions.list.invalidate(),
  });
  const updateNotes = trpc.contactSubmissions.updateNotes.useMutation({
    onSuccess: () => utils.contactSubmissions.list.invalidate(),
  });
  const deleteContact = trpc.contactSubmissions.delete.useMutation({
    onSuccess: () => {
      void utils.contactSubmissions.list.invalidate();
      void utils.contactSubmissions.listDeleted.invalidate();
    },
  });
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<ContactStatus | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = contacts.find((c) => c.id === detailId) ?? null;

  /** Abrir a mensagem já tira ela de "novo" — evita marcar status na mão. */
  const openDetail = (contact: { id?: string; status?: string }) => {
    if (!contact.id) return;
    setDetailId(contact.id);
    if (contact.status === 'novo') {
      updateStatus.mutate({ id: contact.id, status: 'lido' });
    }
  };

  const onDrop = (status: ContactStatus) => {
    setDragOverCol(null);
    if (!draggingId) return;
    const contact = contacts.find((c) => c.id === draggingId);
    setDraggingId(null);
    if (!contact || contact.status === status) return;
    updateStatus.mutate({ id: contact.id, status });
  };

  return (
    <>
    <div className="flex gap-4 overflow-x-auto pb-4 min-h-[400px]">
      {CONTACT_COLS.map(col => {
        const cards = contacts.filter(c => c.status === col.key);
        const isOver = dragOverCol === col.key;
        return (
          <div
            key={col.key}
            onDragOver={(e) => { e.preventDefault(); setDragOverCol(col.key); }}
            onDragLeave={() => setDragOverCol((c) => (c === col.key ? null : c))}
            onDrop={() => onDrop(col.key)}
            className={`flex-shrink-0 w-72 rounded-2xl border ${col.color} p-4 flex flex-col gap-3 transition-colors ${isOver ? 'ring-2 ring-eagle-red/60' : ''}`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-heading font-semibold text-white text-sm">{col.label}</span>
              <span className="text-xs bg-zinc-800 text-zinc-300 rounded-full px-2 py-0.5">{cards.length}</span>
            </div>
            {cards.length === 0 && (
              <p className="text-xs text-zinc-600 text-center py-6 border border-dashed border-zinc-800 rounded-xl">
                {isOver ? 'Solte aqui' : 'Nenhum contato'}
              </p>
            )}
            {cards.map(contact => (
              <div
                key={contact.id}
                draggable
                onDragStart={(e) => {
                  setDraggingId(contact.id);
                  e.dataTransfer.effectAllowed = 'move';
                  e.dataTransfer.setData('text/plain', contact.id);
                }}
                onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
                className={`bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 space-y-2 cursor-grab active:cursor-grabbing transition-opacity ${draggingId === contact.id ? 'opacity-40' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-1.5 min-w-0">
                    <GripVertical size={14} className="text-zinc-600 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm truncate">{contact.name}</p>
                      <p className="text-xs text-zinc-400 truncate">{contact.email}</p>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openDetail(contact)}
                      title="Ler mensagem completa"
                      aria-label={`Ler mensagem de ${contact.name}`}
                      className="text-zinc-600 hover:text-eagle-gold transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteContact.mutate({ id: contact.id })}
                      title="Mover para a lixeira"
                      aria-label={`Mover ${contact.name} para a lixeira`}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-zinc-500 space-y-0.5">
                  {contact.phone && <p>{contact.phone}</p>}
                  <p className="text-zinc-400 line-clamp-2">{contact.message}</p>
                  <div className="flex items-center gap-2 pt-0.5">
                    <span className="text-zinc-700">{formatDate(contact.createdAt)}</span>
                    <AgeBadge
                      date={contact.createdAt}
                      late={responseState(contact).key === 'em-atraso'}
                    />
                  </div>
                </div>
                <textarea
                  className="w-full bg-zinc-800/60 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-eagle-red resize-none"
                  rows={2}
                  placeholder="Anotações..."
                  value={editingNotes[contact.id] ?? contact.notes}
                  onChange={e => setEditingNotes(p => ({ ...p, [contact.id]: e.target.value }))}
                  onBlur={() => {
                    const notes = editingNotes[contact.id];
                    if (notes !== undefined && notes !== contact.notes) {
                      updateNotes.mutate({ id: contact.id, notes });
                    }
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  draggable={false}
                />
              </div>
            ))}
          </div>
        );
      })}
    </div>

    <DetailModal
      open={detail !== null}
      title={detail?.name ?? ''}
      subtitle={
        detail
          ? `Contato · recebido em ${formatDateTime(detail.createdAt)} (${formatAge(detail.createdAt)})`
          : undefined
      }
      onClose={() => setDetailId(null)}
      footer={
        detail ? (
          <>
            <a
              href={mailtoLink(
                detail.email,
                'Sua mensagem para a Eagle Center Fitness',
                detail.name.split(' ')[0] ?? detail.name,
              )}
              onClick={() => {
                if (detail.status !== 'respondido') {
                  updateStatus.mutate({ id: detail.id, status: 'respondido' });
                }
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-eagle-red hover:bg-red-700 text-white text-sm font-heading font-semibold transition-colors"
            >
              <Mail size={15} />
              Responder por e-mail
            </a>
            <button
              type="button"
              onClick={() => setDetailId(null)}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 text-sm text-zinc-300 hover:bg-zinc-900 transition-colors"
            >
              Fechar
            </button>
          </>
        ) : null
      }
    >
      {detail && (
        <div className="space-y-1">
          <DetailRow label="E-mail">
            <span className="inline-flex items-center gap-1.5">
              <a href={`mailto:${detail.email}`} className="text-eagle-gold hover:underline">
                {detail.email}
              </a>
              {/* Sem app de e-mail padrão o `mailto:` não abre nada — daí o copiar. */}
              <CopyButton value={detail.email} label="Copiar e-mail" />
            </span>
          </DetailRow>
          <DetailRow label="Telefone">
            {detail.phone ? (
              <a href={`tel:${detail.phone.replace(/[^+\d]/g, '')}`} className="text-eagle-gold hover:underline">
                {detail.phone}
              </a>
            ) : (
              <span className="text-zinc-500">—</span>
            )}
          </DetailRow>
          <DetailRow label="Situação">
            {(() => {
              const state = responseState(detail);
              return (
                <span
                  className={`inline-flex items-center gap-1.5 text-xs rounded-full border px-2.5 py-1 ${state.className}`}
                >
                  {state.key === 'em-atraso' ? (
                    <AlertTriangle size={12} />
                  ) : state.key === 'respondido' ? (
                    <Check size={12} />
                  ) : (
                    <Clock size={12} />
                  )}
                  {state.label}
                </span>
              );
            })()}
            <p className="text-[11px] text-zinc-600 mt-1.5">
              {detail.respondedAt
                ? `Marcada como respondida em ${formatDateTime(detail.respondedAt)}.`
                : `Vira "em atraso" sozinho após ${RESPONSE_SLA_DAYS} dias sem resposta.`}
            </p>
          </DetailRow>
          <DetailRow label="Status">
            <div className="flex flex-wrap gap-2">
              {CONTACT_COLS.map((col) => {
                const active = detail.status === col.key;
                return (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() =>
                      !active &&
                      updateStatus.mutate({ id: detail.id, status: col.key })
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-eagle-red text-white'
                        : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white'
                    }`}
                  >
                    {col.label}
                  </button>
                );
              })}
            </div>
          </DetailRow>
          <DetailRow label="Mensagem">
            <p className="whitespace-pre-wrap leading-relaxed">{detail.message}</p>
          </DetailRow>
          <DetailRow label="Anotações">
            <textarea
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-eagle-red resize-y min-h-[80px]"
              placeholder="Anotações internas..."
              value={editingNotes[detail.id] ?? detail.notes}
              onChange={(e) =>
                setEditingNotes((prev) => ({ ...prev, [detail.id]: e.target.value }))
              }
              onBlur={() => {
                const notes = editingNotes[detail.id];
                if (notes !== undefined && notes !== detail.notes) {
                  updateNotes.mutate({ id: detail.id, notes });
                }
              }}
            />
          </DetailRow>
        </div>
      )}
    </DetailModal>
    </>
  );
}

// --- Lixeira ---

/**
 * Lixeira de leads e contatos.
 *
 * Excluir no quadro só manda para cá — o registro continua no banco por 30
 * dias e pode voltar. Foi o que faltava quando uma mensagem era apagada por
 * engano: antes o `delete` removia a linha e não havia como desfazer.
 */
function TrashPanel() {
  const utils = trpc.useUtils();
  const { data: leads = [], isLoading: loadingLeads } =
    trpc.franchiseLeads.listDeleted.useQuery();
  const { data: contacts = [], isLoading: loadingContacts } =
    trpc.contactSubmissions.listDeleted.useQuery();

  const refreshLeads = () => {
    void utils.franchiseLeads.listDeleted.invalidate();
    void utils.franchiseLeads.list.invalidate();
  };
  const refreshContacts = () => {
    void utils.contactSubmissions.listDeleted.invalidate();
    void utils.contactSubmissions.list.invalidate();
  };

  const restoreLead = trpc.franchiseLeads.restore.useMutation({
    onSuccess: refreshLeads,
  });
  const purgeLead = trpc.franchiseLeads.purge.useMutation({
    onSuccess: refreshLeads,
  });
  const restoreContact = trpc.contactSubmissions.restore.useMutation({
    onSuccess: refreshContacts,
  });
  const purgeContact = trpc.contactSubmissions.purge.useMutation({
    onSuccess: refreshContacts,
  });

  /** Id aguardando confirmação de exclusão definitiva. */
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmingEmpty, setConfirmingEmpty] = useState(false);

  // Esvaziar a lixeira é irreversível, então fica só para admin — o backend
  // aplica a mesma regra (`adminProcedure`), isto aqui é só a UI acompanhando.
  const { role } = useAdminAuth();
  const purgeAllLeads = trpc.franchiseLeads.purgeAll.useMutation({
    onSuccess: refreshLeads,
  });
  const purgeAllContacts = trpc.contactSubmissions.purgeAll.useMutation({
    onSuccess: refreshContacts,
  });
  const emptyTrash = () => {
    purgeAllLeads.mutate();
    purgeAllContacts.mutate();
    setConfirmingEmpty(false);
  };

  const rows = [
    ...leads.map((lead) => ({
      id: lead.id ?? '',
      kind: 'Lead de franquia',
      name: lead.name ?? '',
      detail: [lead.email, lead.city].filter(Boolean).join(' · '),
      deletedAt: lead.deletedAt,
      onRestore: () => restoreLead.mutate({ id: lead.id ?? '' }),
      onPurge: () => purgeLead.mutate({ id: lead.id ?? '' }),
    })),
    ...contacts.map((contact) => ({
      id: contact.id ?? '',
      kind: 'Contato',
      name: contact.name ?? '',
      detail: [contact.email, contact.message?.slice(0, 60)]
        .filter(Boolean)
        .join(' · '),
      deletedAt: contact.deletedAt,
      onRestore: () => restoreContact.mutate({ id: contact.id ?? '' }),
      onPurge: () => purgeContact.mutate({ id: contact.id ?? '' }),
    })),
  ].sort((a, b) => {
    const at = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
    const bt = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
    return bt - at;
  });

  if (loadingLeads || loadingContacts) {
    return <p className="text-sm text-zinc-500 py-8 text-center">Carregando…</p>;
  }

  if (rows.length === 0) {
    return (
      <div className="py-14 text-center">
        <Trash2 size={28} className="text-zinc-700 mx-auto mb-3" />
        <p className="text-sm text-zinc-400">A lixeira está vazia.</p>
        <p className="text-xs text-zinc-600 mt-1.5">
          O que for excluído no quadro aparece aqui e pode ser restaurado por{' '}
          {TRASH_RETENTION_DAYS} dias.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">
          Itens excluídos ficam aqui por {TRASH_RETENTION_DAYS} dias e depois são
          apagados automaticamente.
        </p>
        {role === 'admin' &&
          (confirmingEmpty ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={emptyTrash}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-700 text-white hover:bg-red-600 transition-colors"
              >
                <AlertTriangle size={13} />
                Apagar os {rows.length} itens de vez
              </button>
              <button
                type="button"
                onClick={() => setConfirmingEmpty(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingEmpty(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-700 text-zinc-400 hover:text-red-300 hover:border-red-800 transition-colors"
            >
              <Trash2 size={13} />
              Esvaziar lixeira
            </button>
          ))}
      </div>
      {rows.map((row) => (
        <div
          key={`${row.kind}-${row.id}`}
          className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 border border-zinc-700 rounded-full px-2 py-0.5">
                {row.kind}
              </span>
              <p className="font-medium text-white text-sm truncate">
                {row.name}
              </p>
            </div>
            <p className="text-xs text-zinc-500 truncate mt-1">{row.detail}</p>
            {row.deletedAt && (
              <p className="text-[11px] text-zinc-600 mt-1">
                Excluído {formatAge(row.deletedAt)} · sai da lixeira em{' '}
                {Math.max(
                  0,
                  TRASH_RETENTION_DAYS - daysSince(row.deletedAt),
                )}{' '}
                dias
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={row.onRestore}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              <RotateCcw size={13} />
              Restaurar
            </button>
            {confirmingId === row.id ? (
              <button
                type="button"
                onClick={() => {
                  row.onPurge();
                  setConfirmingId(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-700 text-white hover:bg-red-600 transition-colors"
              >
                <AlertTriangle size={13} />
                Confirmar exclusão
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingId(row.id)}
                title="Excluir definitivamente"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-zinc-700 text-zinc-400 hover:text-red-300 hover:border-red-800 transition-colors"
              >
                <Trash2 size={13} />
                Excluir de vez
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Main Panel ---
export default function AdminLeadsPanel() {
  const [tab, setTab] = useState<'franchise' | 'contact' | 'trash'>('franchise');

  return (
    <section className="border border-zinc-800/80 rounded-2xl p-6 md:p-8 bg-zinc-900/25 shadow-xl shadow-black/30">
      <div className="mb-6 pb-4 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-heading font-bold text-white tracking-tight">Leads e Contatos</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {tab === 'trash'
              ? `Itens excluídos ficam recuperáveis por ${TRASH_RETENTION_DAYS} dias.`
              : 'Arraste os cards entre as colunas para mudar o status.'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('franchise')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'franchise' ? 'bg-eagle-red text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
          >
            <Users size={15} /> Franqueados
          </button>
          <button
            type="button"
            onClick={() => setTab('contact')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'contact' ? 'bg-eagle-red text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
          >
            <MessageSquare size={15} /> Contatos
          </button>
          <button
            type="button"
            onClick={() => setTab('trash')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'trash' ? 'bg-eagle-red text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`}
          >
            <Trash2 size={15} /> Lixeira
          </button>
        </div>
      </div>
      {tab === 'franchise' && <FranchiseKanban />}
      {tab === 'contact' && <ContactKanban />}
      {tab === 'trash' && <TrashPanel />}
    </section>
  );
}
