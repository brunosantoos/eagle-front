import { useEffect, useState, type ReactNode } from 'react';
import { Eye, GripVertical, Mail, MessageSquare, Trash2, Users, X } from 'lucide-react';
import { trpc } from '../../lib/trpc';

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
    onSuccess: () => utils.franchiseLeads.list.invalidate(),
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
                      title="Excluir lead"
                      aria-label={`Excluir ${lead.name}`}
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
                  <p className="text-zinc-700">{formatDate(lead.createdAt)}</p>
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
      subtitle={detail ? `Lead de franquia · recebido em ${formatDateTime(detail.createdAt)}` : undefined}
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
            <a href={`mailto:${detail.email}`} className="text-eagle-gold hover:underline">
              {detail.email}
            </a>
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
    onSuccess: () => utils.contactSubmissions.list.invalidate(),
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
                      title="Excluir contato"
                      aria-label={`Excluir ${contact.name}`}
                      className="text-zinc-600 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-zinc-500 space-y-0.5">
                  {contact.phone && <p>{contact.phone}</p>}
                  <p className="text-zinc-400 line-clamp-2">{contact.message}</p>
                  <p className="text-zinc-700">{formatDate(contact.createdAt)}</p>
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
      subtitle={detail ? `Contato · recebido em ${formatDateTime(detail.createdAt)}` : undefined}
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
            <a href={`mailto:${detail.email}`} className="text-eagle-gold hover:underline">
              {detail.email}
            </a>
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
          <DetailRow label="Status">
            {CONTACT_COLS.find((c) => c.key === detail.status)?.label ?? detail.status}
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

// --- Main Panel ---
export default function AdminLeadsPanel() {
  const [tab, setTab] = useState<'franchise' | 'contact'>('franchise');

  return (
    <section className="border border-zinc-800/80 rounded-2xl p-6 md:p-8 bg-zinc-900/25 shadow-xl shadow-black/30">
      <div className="mb-6 pb-4 border-b border-zinc-800/80 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-heading font-bold text-white tracking-tight">Leads e Contatos</h2>
          <p className="text-sm text-zinc-500 mt-1">Arraste os cards entre as colunas para mudar o status.</p>
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
        </div>
      </div>
      {tab === 'franchise' ? <FranchiseKanban /> : <ContactKanban />}
    </section>
  );
}
