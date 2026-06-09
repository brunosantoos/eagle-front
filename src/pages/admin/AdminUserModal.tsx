import { useEffect, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { useToast } from '../../context/ToastProvider';
import type { AdminUser, AdminUserRole } from '../../lib/adminUsers';

const inCls =
  'w-full bg-eagle-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-eagle-red focus:ring-1 focus:ring-eagle-red/40';

type Mode = 'create' | 'edit';

export function AdminUserModal({
  open,
  mode,
  user,
  onClose,
  onSubmit,
}: {
  open: boolean;
  mode: Mode;
  user: AdminUser | null;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    email: string;
    role: AdminUserRole;
    active: boolean;
    password: string;
  }) => void;
}) {
  const { error: toastError } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdminUserRole>('editor');
  const [active, setActive] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && user) {
      setName(user.name);
      setEmail(user.email);
      setRole(user.role);
      setActive(user.active);
      setPassword('');
      setConfirm('');
    } else if (mode === 'create') {
      setName('');
      setEmail('');
      setRole('editor');
      setActive(true);
      setPassword('');
      setConfirm('');
    }
  }, [open, mode, user]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    if (open) document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'create' && password !== confirm) {
      toastError('As senhas não conferem.');
      return;
    }
    onSubmit({ name, email, role, active, password });
  };

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center p-4 animate-[fadeIn_140ms_ease-out]">
      <button
        type="button"
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        aria-label="Fechar"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-700/80 bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-2xl shadow-black/60 animate-[modalIn_160ms_cubic-bezier(0.16,1,0.3,1)]">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-eagle-red/40 to-transparent" aria-hidden />
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80">
          <h2 className="text-lg font-heading font-bold text-white">
            {mode === 'create' ? 'Novo usuário' : 'Editar usuário'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Nome
            </label>
            <input
              className={inCls}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              E-mail
            </label>
            <input
              type="email"
              className={inCls}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Perfil
            </label>
            <select
              className={inCls}
              value={role}
              onChange={(e) => {
                const v = e.target.value;
                setRole(v === 'admin' || v === 'user' ? v : 'editor');
              }}
            >
              <option value="admin">Administrador (tudo)</option>
              <option value="editor">Editor (textos do site)</option>
              <option value="user">Usuário (leads e contatos)</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-zinc-600 bg-eagle-black text-eagle-red focus:ring-eagle-red/40"
            />
            Conta ativa (pode entrar no painel)
          </label>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              {mode === 'create'
                ? 'Senha'
                : 'Nova senha (deixe em branco para manter)'}
            </label>
            <input
              type="password"
              className={inCls}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={mode === 'create' ? 6 : 0}
              required={mode === 'create'}
            />
          </div>
          {mode === 'create' ? (
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Confirmar senha
              </label>
              <input
                type="password"
                className={inCls}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
          ) : null}
          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-600 text-sm text-zinc-200 hover:bg-zinc-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-eagle-red hover:bg-red-700 active:bg-red-800 text-white text-sm font-heading font-semibold transition-all shadow-lg shadow-red-900/30 ring-1 ring-red-500/30 hover:ring-red-400/40"
            >
              {mode === 'create' ? 'Criar usuário' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
