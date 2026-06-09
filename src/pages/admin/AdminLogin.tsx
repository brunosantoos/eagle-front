import { type FormEvent, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthProvider';
import { useToast } from '../../context/ToastProvider';

export default function AdminLogin() {
  const { isAuthenticated, login } = useAdminAuth();
  const { error: toastError } = useToast();
  const location = useLocation();
  const from =
    (location.state as { from?: string } | null)?.from ?? '/admin';
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (await login(email, password)) {
        navigate(from, { replace: true });
      } else {
        toastError('E-mail ou senha inválidos.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-eagle-black text-eagle-light flex items-center justify-center px-4 overflow-hidden">
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 10%, rgba(190,30,45,0.18), transparent 40%), radial-gradient(circle at 85% 90%, rgba(212,175,55,0.12), transparent 45%)',
        }}
      />
      <div className="absolute inset-0 pointer-events-none" aria-hidden
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
          backgroundSize: '38px 38px',
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-eagle-gold text-xs font-medium tracking-wide transition-colors"
          >
            <ArrowLeft size={14} />
            Voltar ao site
          </Link>
          <div className="mt-6 flex justify-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-eagle-red via-red-800 to-red-950 flex items-center justify-center shadow-xl shadow-red-900/40 ring-1 ring-red-500/30">
              <img src="/logo.png" alt="Eagle Center" className="h-10 w-10 object-contain" />
            </div>
          </div>
          <h1 className="mt-5 text-2xl md:text-3xl font-heading font-bold text-white">
            Painel administrativo
          </h1>
          <p className="mt-2 text-zinc-500 text-sm">
            Acesse com seu e-mail e senha.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="relative bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/80 border border-zinc-800/80 rounded-2xl p-7 shadow-2xl shadow-black/50 space-y-5 backdrop-blur"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-eagle-red/40 to-transparent" aria-hidden />

          <div className="space-y-1.5">
            <label htmlFor="admin-email" className="text-xs font-semibold text-zinc-300 tracking-wide">
              E-mail
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-eagle-black/80 border border-zinc-700/80 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder:text-zinc-600 transition-colors hover:border-zinc-600 focus:outline-none focus:border-eagle-red focus:ring-2 focus:ring-eagle-red/30"
                placeholder="voce@empresa.com"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="admin-password" className="text-xs font-semibold text-zinc-300 tracking-wide">
              Senha
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-eagle-black/80 border border-zinc-700/80 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-zinc-600 transition-colors hover:border-zinc-600 focus:outline-none focus:border-eagle-red focus:ring-2 focus:ring-eagle-red/30"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800/60 transition-colors"
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 bg-eagle-red hover:bg-red-700 active:bg-red-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-heading font-semibold py-3 rounded-xl transition-all shadow-lg shadow-red-900/30 ring-1 ring-red-500/30"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
