import { useState } from 'react';
import { Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import { useAdminUsers } from '../../context/AdminUsersProvider';
import { useToast } from '../../context/ToastProvider';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { AdminUserModal } from './AdminUserModal';
import type { AdminUser } from '../../lib/adminUsers';

const ROLE_STYLE: Record<AdminUser['role'], { label: string; cls: string }> = {
  admin: { label: 'Administrador', cls: 'bg-eagle-red/15 text-eagle-gold border-eagle-red/30' },
  editor: { label: 'Editor', cls: 'bg-blue-500/15 text-blue-200 border-blue-500/30' },
  user: { label: 'Usuário', cls: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30' },
};

function initials(name: string, email: string) {
  const src = (name?.trim() || email?.trim() || 'A').replace(/[^\p{L}\p{N} ]/gu, '').trim();
  if (!src) return 'A';
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AdminUsersPanel() {
  const { users, addUser, updateUser, removeUser } = useAdminUsers();
  const { success, error } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreate = () => {
    setModalMode('create');
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (u: AdminUser) => {
    setModalMode('edit');
    setEditing(u);
    setModalOpen(true);
  };

  const victim = deleteId ? users.find((u) => u.id === deleteId) : null;

  const handleModalSubmit = async (data: {
    name: string;
    email: string;
    role: AdminUser['role'];
    active: boolean;
    password: string;
  }) => {
    if (modalMode === 'create') {
      const r = await addUser({
        name: data.name,
        email: data.email,
        role: data.role,
        password: data.password,
        active: data.active,
      });
      if (!r.ok) {
        error(r.reason);
        return;
      }
      success('Usuário criado.');
      setModalOpen(false);
      return;
    }
    if (!editing) return;
    const r = await updateUser(editing.id, {
      name: data.name,
      email: data.email,
      role: data.role,
      active: data.active,
      password: data.password || undefined,
    });
    if (!r.ok) {
      error(r.reason);
      return;
    }
    success('Usuário atualizado.');
    setModalOpen(false);
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const r = await removeUser(deleteId);
    if (!r.ok) {
      error(r.reason);
    } else {
      success('Usuário removido.');
    }
    setDeleteId(null);
  };

  return (
    <>
      <section className="relative overflow-hidden border border-zinc-800/80 rounded-2xl p-6 md:p-8 bg-gradient-to-b from-zinc-900/40 via-zinc-900/20 to-zinc-900/10 shadow-xl shadow-black/30">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-eagle-red/30 to-transparent" aria-hidden />
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 pb-4 border-b border-zinc-800/80">
          <div>
            <h2 className="text-xl font-heading font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="text-eagle-gold shrink-0" size={22} />
              Usuários do painel
            </h2>
            <p className="text-sm text-zinc-500 mt-1.5 max-w-lg">
              Total: <span className="text-zinc-300 font-semibold">{users.length}</span>. Senhas com hash bcrypt.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-eagle-red hover:bg-red-700 active:bg-red-800 text-white text-sm font-heading font-semibold shadow-lg shadow-red-900/25 ring-1 ring-red-500/30 hover:ring-red-400/40 transition-all shrink-0"
          >
            <UserPlus size={18} />
            Novo usuário
          </button>
        </div>

        {users.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 px-6 py-12 text-center">
            <Users className="mx-auto text-zinc-700 mb-3" size={36} />
            <p className="text-sm text-zinc-400">Nenhum usuário cadastrado.</p>
            <p className="text-xs text-zinc-600 mt-1">Clique em "Novo usuário" para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800/60 bg-zinc-950/30">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-950/80 text-zinc-400 text-[11px] uppercase tracking-[0.14em]">
                  <th className="px-4 py-3 font-semibold">Usuário</th>
                  <th className="px-4 py-3 font-semibold">Perfil</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold w-28 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60">
                {users.map((u) => {
                  const r = ROLE_STYLE[u.role];
                  return (
                    <tr key={u.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 border border-zinc-700 flex items-center justify-center text-white text-xs font-heading font-bold">
                            {initials(u.name, u.email)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-white font-medium truncate">{u.name}</p>
                            <p className="text-xs text-zinc-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${r.cls}`}>
                          {r.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs ${u.active ? 'text-emerald-300' : 'text-zinc-500'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${u.active ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-zinc-600'}`} />
                          {u.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(u)}
                            className="p-2 rounded-lg text-zinc-400 hover:text-eagle-gold hover:bg-zinc-800/80 transition-colors"
                            aria-label="Editar"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(u.id)}
                            className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                            aria-label="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <AdminUserModal
        open={modalOpen}
        mode={modalMode}
        user={editing}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleModalSubmit}
      />

      <ConfirmModal
        open={deleteId !== null}
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Excluir usuário?"
        description={
          victim
            ? `Remover permanentemente ${victim.name} (${victim.email})? Esta ação não pode ser desfeita.`
            : undefined
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </>
  );
}
