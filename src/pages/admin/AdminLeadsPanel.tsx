import { useState } from 'react';
import { Trash2, Users, MessageSquare, GripVertical } from 'lucide-react';
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

  const onDrop = (status: FranchiseStatus) => {
    setDragOverCol(null);
    if (!draggingId) return;
    const lead = leads.find((l) => l.id === draggingId);
    setDraggingId(null);
    if (!lead || lead.status === status) return;
    updateStatus.mutate({ id: lead.id, status });
  };

  return (
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
                  <button
                    type="button"
                    onClick={() => deleteLead.mutate({ id: lead.id })}
                    className="shrink-0 text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
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

  const onDrop = (status: ContactStatus) => {
    setDragOverCol(null);
    if (!draggingId) return;
    const contact = contacts.find((c) => c.id === draggingId);
    setDraggingId(null);
    if (!contact || contact.status === status) return;
    updateStatus.mutate({ id: contact.id, status });
  };

  return (
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
                  <button
                    type="button"
                    onClick={() => deleteContact.mutate({ id: contact.id })}
                    className="shrink-0 text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
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
