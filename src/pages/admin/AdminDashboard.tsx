import {
  type LucideIcon,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  ExternalLink,
  GraduationCap,
  Handshake,
  Home,
  Image as ImageIcon,
  Inbox,
  LogOut,
  MapPin,
  PanelLeft,
  Plus,
  RotateCcw,
  Save,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ConfirmModal } from '../../components/admin/ConfirmModal';
import { RichTextEditor } from '../../components/admin/RichTextEditor';
import { useAdminAuth, type AdminRole } from '../../context/AdminAuthProvider';
import { useSiteContent } from '../../context/SiteContentProvider';
import { useToast } from '../../context/ToastProvider';
import { CARD_ICON_OPTIONS, resolveCardIcon } from '../../lib/cardIcons';
import { SOCIAL_PLATFORMS, resolveSocialIcon } from '../../lib/socialIcons';
import { defaultSiteContent, type HeroMediaType } from '../../lib/siteContent';
import { AdminMediaPanel } from './AdminMediaPanel';
import { ImageUploader } from '../../components/admin/ImageUploader';
import { VideoUploader } from '../../components/admin/VideoUploader';
import { AdminUsersPanel } from './AdminUsersPanel';
import AdminLeadsPanel from './AdminLeadsPanel';

/** Fallbacks por posição usados na página pública quando o card não tem ícone próprio. */
const WHY_FALLBACK_ICONS = [TrendingUp, Building2, Handshake] as const;
const SUPPORT_FALLBACK_ICONS = [MapPin, GraduationCap, BarChart3] as const;

const inCls =
  'w-full bg-eagle-black/80 border border-zinc-700/80 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-500 transition-colors hover:border-zinc-600 focus:outline-none focus:border-eagle-red focus:ring-2 focus:ring-eagle-red/30';
const taCls = `${inCls} min-h-[88px] resize-y`;
const lbCls = 'block text-xs font-medium text-zinc-300 mb-1.5 tracking-wide';

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border border-zinc-800/80 rounded-2xl p-6 md:p-8 bg-gradient-to-b from-zinc-900/40 via-zinc-900/20 to-zinc-900/10 shadow-xl shadow-black/30">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-eagle-red/30 to-transparent" aria-hidden />
      <div className="mb-6 pb-4 border-b border-zinc-800/80">
        <h2 className="text-xl font-heading font-bold text-white tracking-tight">
          {title}
        </h2>
        {subtitle ? (
          <p className="text-sm text-zinc-500 mt-1.5">{subtitle}</p>
        ) : null}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function SectionSaveBar({
  onSave,
  label = 'Salvar e publicar no site',
}: {
  onSave: () => void;
  label?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-8 mt-8 border-t border-zinc-800/80">
      <div className="flex items-start gap-2 max-w-md">
        <span className="mt-0.5 h-2 w-2 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.5)] shrink-0" aria-hidden />
        <p className="text-xs text-zinc-400 leading-relaxed">
          Alterações ficam visíveis no site só depois de salvar esta seção.
        </p>
      </div>
      <button
        type="button"
        onClick={onSave}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-eagle-red hover:bg-red-700 active:bg-red-800 text-white text-sm font-heading font-semibold shadow-lg shadow-red-900/30 transition-all shrink-0 ring-1 ring-red-500/30 hover:ring-red-400/40"
      >
        <Save size={18} strokeWidth={2.5} aria-hidden />
        {label}
      </button>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div>
      <label className={lbCls}>{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#ffffff'}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-14 shrink-0 rounded-lg border border-zinc-700/80 bg-eagle-black/80 cursor-pointer p-1"
        />
        <span className="text-xs text-zinc-400 flex-1 truncate">
          {value || 'Padrão do site'}
        </span>
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="shrink-0 text-xs text-zinc-500 hover:text-eagle-gold transition-colors"
          >
            Usar padrão
          </button>
        )}
      </div>
    </div>
  );
}

function CardIconSelect({
  value,
  fallback,
  onChange,
}: {
  value: string;
  fallback: LucideIcon;
  onChange: (icon: string) => void;
}) {
  const Preview = resolveCardIcon(value, fallback);
  return (
    <div>
      <label className={lbCls}>Ícone do card</label>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 shrink-0 rounded-lg border border-zinc-700/80 bg-eagle-black/60 flex items-center justify-center">
          <Preview size={20} className="text-eagle-gold" />
        </div>
        <select
          className={inCls}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Automático (padrão da posição)</option>
          {CARD_ICON_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

type AdminSectionId =
  | 'nav-footer'
  | 'home'
  | 'about'
  | 'franchise'
  | 'media'
  | 'users'
  | 'leads';

const CONTENT_SECTIONS: AdminSectionId[] = ['nav-footer', 'home', 'about', 'franchise', 'media'];

type SidebarGroup = {
  label: string;
  items: { id: AdminSectionId; label: string; icon: LucideIcon; description: string }[];
};

const ROLE_LABEL: Record<AdminRole, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  user: 'Usuário',
};

const ROLE_BADGE: Record<AdminRole, string> = {
  admin: 'bg-eagle-red/20 text-eagle-gold border-eagle-red/30',
  editor: 'bg-blue-500/15 text-blue-200 border-blue-500/30',
  user: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30',
};

function getInitials(name: string | null, email: string | null) {
  const src = (name?.trim() || email?.trim() || 'A').replace(/[^\p{L}\p{N} ]/gu, '').trim();
  if (!src) return 'A';
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function AdminDashboard() {
  const { content, setContent, resetContent, dbLoaded } = useSiteContent();
  const { logout, role, userName, userEmail } = useAdminAuth();
  const { success, error } = useToast();

  const allowedSections: AdminSectionId[] =
    role === 'admin'
      ? ['nav-footer', 'home', 'about', 'franchise', 'media', 'users', 'leads']
      : role === 'editor'
        ? CONTENT_SECTIONS
        : role === 'user'
          ? ['leads']
          : [];

  const canEditContent = role === 'admin' || role === 'editor';

  const [draft, setDraft] = useState(() => structuredClone(content));
  const [active, setActive] = useState<AdminSectionId>(
    allowedSections[0] ?? 'nav-footer',
  );
  const [resetOpen, setResetOpen] = useState(false);
  const [homeTab, setHomeTab] = useState<'hero' | 'experience' | 'carousel' | 'teaser'>('hero');
  const [navTab, setNavTab] = useState<'menu' | 'footer' | 'privacy'>('menu');
  const [aboutTab, setAboutTab] = useState<'hero' | 'story' | 'pillars' | 'values'>('hero');
  const [franchiseTab, setFranchiseTab] = useState<'hero' | 'why' | 'support' | 'numbers' | 'form'>('hero');

  useEffect(() => {
    if (allowedSections.length === 0) return;
    if (!allowedSections.includes(active)) {
      setActive(allowedSections[0]);
    }
  }, [allowedSections, active]);

  // O draft nasce do localStorage; quando o conteúdo do banco chega, ele precisa
  // ser re-sincronizado — sem isso o save sobrescreve o site com dados velhos.
  useEffect(() => {
    if (!dbLoaded) return;
    setDraft(structuredClone(content));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbLoaded]);

  const SAVE_ERROR_MSG =
    'Não foi possível publicar no servidor. Verifique sua conexão e seu login e salve de novo.';

  const saveNavFooter = () => {
    setContent(
      (prev) => ({
        ...prev,
        nav: structuredClone(draft.nav),
        footer: structuredClone(draft.footer),
        privacyPolicy: structuredClone(draft.privacyPolicy),
      }),
      {
        onSuccess: () => success('Menu e rodapé salvos e publicados.'),
        onError: () => error(SAVE_ERROR_MSG),
      },
    );
  };

  const saveHome = () => {
    setContent(
      (prev) => ({
        ...prev,
        home: structuredClone(draft.home),
      }),
      {
        onSuccess: () => success('Conteúdo da Home publicado.'),
        onError: () => error(SAVE_ERROR_MSG),
      },
    );
  };

  const saveAbout = () => {
    setContent(
      (prev) => ({
        ...prev,
        about: structuredClone(draft.about),
      }),
      {
        onSuccess: () => success('Página Sobre publicada.'),
        onError: () => error(SAVE_ERROR_MSG),
      },
    );
  };

  const saveFranchise = () => {
    setContent(
      (prev) => ({
        ...prev,
        franchise: structuredClone(draft.franchise),
      }),
      {
        onSuccess: () => success('Página Franquia publicada.'),
        onError: () => error(SAVE_ERROR_MSG),
      },
    );
  };

  const saveMedia = () => {
    setContent(
      (prev) => ({
        ...prev,
        media: structuredClone(draft.media),
      }),
      {
        onSuccess: () => success('Imagens e vídeos publicados no site.'),
        onError: () => error(SAVE_ERROR_MSG),
      },
    );
  };

  const sidebarGroups: SidebarGroup[] = [
    {
      label: 'Conteúdo do site',
      items: [
        { id: 'nav-footer', label: 'Menu e rodapé', icon: PanelLeft, description: 'Links, contatos e rodapé' },
        { id: 'home', label: 'Home', icon: Home, description: 'Hero, treinos e CTA' },
        { id: 'about', label: 'Sobre', icon: BookOpen, description: 'História e pilares' },
        { id: 'franchise', label: 'Franquia', icon: Briefcase, description: 'Investimento e formulário' },
        { id: 'media', label: 'Mídias', icon: ImageIcon, description: 'Imagens e vídeos' },
      ],
    },
    {
      label: 'Relacionamento',
      items: [
        { id: 'leads', label: 'Leads e contatos', icon: Inbox, description: 'Pipeline Kanban' },
      ],
    },
    {
      label: 'Administração',
      items: [
        { id: 'users', label: 'Usuários', icon: Users, description: 'Acessos do painel' },
      ],
    },
  ];
  const filteredGroups = sidebarGroups
    .map((g) => ({ ...g, items: g.items.filter((it) => allowedSections.includes(it.id)) }))
    .filter((g) => g.items.length > 0);
  const sidebarNav = filteredGroups.flatMap((g) => g.items);

  const handleConfirmReset = () => {
    resetContent();
    setDraft(structuredClone(defaultSiteContent));
    success('Conteúdo restaurado ao padrão. Salve cada seção para publicar.');
    setResetOpen(false);
  };

  const activeItem = sidebarNav.find((it) => it.id === active);
  const sectionTitle = activeItem?.label ?? 'Painel';
  const SectionIcon = activeItem?.icon;
  const sectionDescription = activeItem?.description ?? '';
  const initials = getInitials(userName, userEmail);
  const roleBadge = role ? ROLE_BADGE[role] : ROLE_BADGE.editor;
  const roleLabel = role ? ROLE_LABEL[role] : '';

  return (
    <div className="fixed inset-0 z-0 flex overflow-hidden bg-eagle-black text-eagle-light">
      <aside className="hidden md:flex w-72 shrink-0 min-h-0 flex-col border-r border-zinc-800/80 bg-gradient-to-b from-zinc-950 via-zinc-950/98 to-eagle-black">
        <div className="shrink-0 flex items-center gap-3 px-4 pt-5 pb-4 border-b border-zinc-800/80">
          <img
            src="/logo.png"
            alt="Eagle Center Fitness"
            className="shrink-0 h-10 w-auto max-h-10 max-w-[3rem] sm:h-11 sm:max-h-11 sm:max-w-[3.25rem] object-contain object-left"
          />
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 font-semibold truncate">
              Eagle Center
            </p>
            <p className="font-heading font-bold text-sm text-white mt-0.5">
              Painel admin
            </p>
          </div>
        </div>

        <div className="shrink-0 px-4 pt-4 pb-3 border-b border-zinc-800/80">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
            <div className="shrink-0 h-9 w-9 rounded-full bg-gradient-to-br from-eagle-red to-red-900 flex items-center justify-center text-white text-xs font-heading font-bold">
              {initials}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="text-sm font-medium text-white truncate">{userName ?? 'Você'}</p>
              <p className="text-[11px] text-zinc-500 truncate">{userEmail ?? ''}</p>
            </div>
          </div>
          {role && (
            <span className={`inline-flex items-center mt-2 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider font-semibold border ${roleBadge}`}>
              {roleLabel}
            </span>
          )}
        </div>

        <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-5">
          {filteredGroups.map((group) => (
            <div key={group.label}>
              <p className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isOn = active === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActive(item.id)}
                      className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left border ${isOn
                        ? 'bg-eagle-red/15 text-eagle-gold border-eagle-red/30 shadow-sm shadow-red-950/30'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60 border-transparent'
                        }`}
                    >
                      <Icon size={17} strokeWidth={isOn ? 2.25 : 1.8} className={`shrink-0 ${isOn ? 'text-eagle-gold' : 'text-zinc-500 group-hover:text-white'}`} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {isOn && <span className="h-1.5 w-1.5 rounded-full bg-eagle-gold shadow-[0_0_6px_rgba(212,175,55,0.6)]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="shrink-0 p-4 border-t border-zinc-800/80 space-y-2 bg-zinc-950/50">
          <Link
            to="/"
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors"
          >
            <ExternalLink size={16} />
            Ver site
          </Link>
          {canEditContent && (
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-amber-200/90 hover:bg-amber-950/30 transition-colors text-left"
            >
              <RotateCcw size={16} />
              Restaurar padrão
            </button>
          )}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors text-left"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="shrink-0 z-20 border-b border-zinc-800/80 bg-eagle-black/90 backdrop-blur-md px-4 md:px-8 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {SectionIcon && (
                <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-eagle-red/25 to-red-950/30 border border-eagle-red/30 shadow-inner">
                  <SectionIcon size={20} className="text-eagle-gold" strokeWidth={2} />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.18em] font-semibold">
                  Painel admin
                </p>
                <h1 className="text-lg md:text-2xl font-heading font-bold text-white truncate">
                  {sectionTitle}
                </h1>
                {sectionDescription && (
                  <p className="hidden sm:block text-xs text-zinc-500 mt-0.5 truncate">
                    {sectionDescription}
                  </p>
                )}
              </div>
            </div>
            <div className="flex md:hidden items-center gap-1.5 overflow-x-auto pb-1 -mx-1 scrollbar-thin">
              {sidebarNav.map((item) => {
                const Icon = item.icon;
                const isOn = active === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActive(item.id)}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isOn
                      ? 'bg-eagle-red text-white shadow-sm shadow-red-900/40'
                      : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
                      }`}
                  >
                    <Icon size={13} strokeWidth={2} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 md:px-8 py-8">
          <div className="space-y-8 pb-24">
            {active === 'media' && (
              <AdminMediaPanel
                media={draft.media}
                onMediaChange={(m) =>
                  setDraft((d) => ({ ...d, media: m }))
                }
                onSave={saveMedia}
              />
            )}
            {active === 'users' && <AdminUsersPanel />}
            {active === 'leads' && <AdminLeadsPanel />}
            {active === 'nav-footer' && (
              <Section
                title="Menu (navbar) e rodapé"
                subtitle="Textos da navegação principal e do rodapé"
              >
                <div className="flex flex-wrap gap-2 -mt-2 mb-2 p-1 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
                  {[
                    { id: 'menu', label: 'Menu (navbar)', hint: 'Links do topo' },
                    { id: 'footer', label: 'Rodapé', hint: 'Tagline, colunas, contato' },
                    { id: 'privacy', label: 'Política de privacidade', hint: 'Página /privacidade' },
                  ].map((t) => {
                    const on = navTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setNavTab(t.id as typeof navTab)}
                        className={`flex-1 min-w-[140px] px-3 py-2 rounded-lg text-left transition-all ${on
                          ? 'bg-eagle-red/15 border border-eagle-red/30 text-white shadow-sm shadow-red-950/30'
                          : 'border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        }`}
                      >
                        <p className="text-sm font-heading font-semibold leading-tight">{t.label}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{t.hint}</p>
                      </button>
                    );
                  })}
                </div>

                {navTab === 'menu' && (<>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className={lbCls}>Link — Home</label>
                    <input
                      className={inCls}
                      value={draft.nav.home}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          nav: { ...d.nav, home: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={lbCls}>Link — Sobre</label>
                    <input
                      className={inCls}
                      value={draft.nav.about}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          nav: { ...d.nav, about: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={lbCls}>Link — Franquia</label>
                    <input
                      className={inCls}
                      value={draft.nav.franchise}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          nav: { ...d.nav, franchise: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
                </>)}

                {navTab === 'footer' && (<>
                <div>
                  <label className={lbCls}>Rodapé — tagline</label>
                  <RichTextEditor
                    value={draft.footer.tagline}
                    onChange={(html) =>
                      setDraft((d) => ({
                        ...d,
                        footer: { ...d.footer, tagline: html },
                      }))
                    }
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbCls}>Coluna — Navegação (título)</label>
                    <input
                      className={inCls}
                      value={draft.footer.navTitle}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          footer: { ...d.footer, navTitle: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={lbCls}>Coluna — Franquia (título)</label>
                    <input
                      className={inCls}
                      value={draft.footer.franchiseColumnTitle}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          footer: {
                            ...d.footer,
                            franchiseColumnTitle: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={lbCls}>Coluna — Contato (título)</label>
                    <input
                      className={inCls}
                      value={draft.footer.contactTitle}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          footer: { ...d.footer, contactTitle: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={lbCls}>Copyright — nome da marca</label>
                    <input
                      className={inCls}
                      value={draft.footer.copyrightName}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          footer: { ...d.footer, copyrightName: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbCls}>Link rodapé — Home</label>
                    <input
                      className={inCls}
                      value={draft.footer.linkHome}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          footer: { ...d.footer, linkHome: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={lbCls}>Link rodapé — Sobre</label>
                    <input
                      className={inCls}
                      value={draft.footer.linkAbout}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          footer: { ...d.footer, linkAbout: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={lbCls}>Link rodapé — Franquia</label>
                    <input
                      className={inCls}
                      value={draft.footer.linkFranchise}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          footer: { ...d.footer, linkFranchise: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className={lbCls}>Franquia — link 1</label>
                    <input
                      className={inCls}
                      value={draft.footer.franchiseLink1}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          footer: { ...d.footer, franchiseLink1: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={lbCls}>Franquia — link 2</label>
                    <input
                      className={inCls}
                      value={draft.footer.franchiseLink2}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          footer: { ...d.footer, franchiseLink2: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={lbCls}>Franquia — link 3</label>
                    <input
                      className={inCls}
                      value={draft.footer.franchiseLink3}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          footer: { ...d.footer, franchiseLink3: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={lbCls}>Endereço — linha 1</label>
                    <input
                      className={inCls}
                      value={draft.footer.addressLine1}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          footer: { ...d.footer, addressLine1: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={lbCls}>Endereço — linha 2</label>
                    <input
                      className={inCls}
                      value={draft.footer.addressLine2}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          footer: { ...d.footer, addressLine2: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={lbCls}>Telefone</label>
                    <input
                      className={inCls}
                      value={draft.footer.phone}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          footer: { ...d.footer, phone: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={lbCls}>E-mail</label>
                    <input
                      className={inCls}
                      value={draft.footer.email}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          footer: { ...d.footer, email: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={lbCls}>Termos de uso (texto)</label>
                    <input
                      className={inCls}
                      value={draft.footer.terms}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          footer: { ...d.footer, terms: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={lbCls}>Política de privacidade (texto)</label>
                    <input
                      className={inCls}
                      value={draft.footer.privacy}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          footer: { ...d.footer, privacy: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-heading font-semibold text-eagle-light">Redes sociais</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        Ícones exibidos no rodapé. Links vazios não aparecem no site.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          footer: {
                            ...d.footer,
                            socialLinks: [
                              ...d.footer.socialLinks,
                              { platform: 'instagram', url: '' },
                            ],
                          },
                        }))
                      }
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-eagle-red hover:bg-red-700 active:bg-red-800 text-white text-xs font-heading font-semibold ring-1 ring-red-500/30 hover:ring-red-400/40 transition-all"
                    >
                      <Plus size={14} strokeWidth={2.5} />
                      Adicionar rede
                    </button>
                  </div>
                  <div className="space-y-3 mt-3">
                    {draft.footer.socialLinks.map((s, i) => {
                      const Icon = resolveSocialIcon(s.platform);
                      return (
                        <div key={i} className="p-4 rounded-xl border border-zinc-800 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="flex items-center gap-2 text-xs text-eagle-gold font-semibold">
                              <Icon size={16} />
                              Rede {i + 1}
                            </p>
                            <button
                              type="button"
                              onClick={() =>
                                setDraft((d) => ({
                                  ...d,
                                  footer: {
                                    ...d.footer,
                                    socialLinks: d.footer.socialLinks.filter((_, idx) => idx !== i),
                                  },
                                }))
                              }
                              title="Remover rede"
                              aria-label={`Remover rede ${i + 1}`}
                              className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className={lbCls}>Plataforma</label>
                              <select
                                className={inCls}
                                value={s.platform}
                                onChange={(e) =>
                                  setDraft((d) => {
                                    const socialLinks = [...d.footer.socialLinks];
                                    socialLinks[i] = { ...socialLinks[i], platform: e.target.value };
                                    return { ...d, footer: { ...d.footer, socialLinks } };
                                  })
                                }
                              >
                                {SOCIAL_PLATFORMS.map((p) => (
                                  <option key={p.value} value={p.value}>
                                    {p.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className={lbCls}>URL</label>
                              <input
                                className={inCls}
                                placeholder="https://..."
                                value={s.url}
                                onChange={(e) =>
                                  setDraft((d) => {
                                    const socialLinks = [...d.footer.socialLinks];
                                    socialLinks[i] = { ...socialLinks[i], url: e.target.value };
                                    return { ...d, footer: { ...d.footer, socialLinks } };
                                  })
                                }
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                </>)}

                {navTab === 'privacy' && (<>
                <p className="text-xs text-zinc-500 -mt-1">
                  Conteúdo exibido na página <span className="text-zinc-300">/privacidade</span>, acessível pelo link &quot;{draft.footer.privacy}&quot; no rodapé do site.
                </p>
                <div>
                  <label className={lbCls}>Título da página</label>
                  <input
                    className={inCls}
                    value={draft.privacyPolicy.title}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        privacyPolicy: { ...d.privacyPolicy, title: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Texto da política</label>
                  <RichTextEditor
                    value={draft.privacyPolicy.content}
                    onChange={(html) =>
                      setDraft((d) => ({
                        ...d,
                        privacyPolicy: { ...d.privacyPolicy, content: html },
                      }))
                    }
                  />
                </div>
                </>)}

                <SectionSaveBar onSave={saveNavFooter} label="Salvar menu e rodapé" />
              </Section>
            )}

            {active === 'home' && (
              <Section
                title="Página inicial (Home)"
                subtitle="Hero, experiência, carrossel de treinos e bloco de franquia"
              >
                <div className="flex flex-wrap gap-2 -mt-2 mb-2 p-1 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
                  {[
                    { id: 'hero', label: 'Hero', hint: 'Topo da página' },
                    { id: 'experience', label: 'Experiência', hint: 'Lista de diferenciais' },
                    { id: 'carousel', label: 'Carrossel de treinos', hint: 'Cards' },
                    { id: 'teaser', label: 'Chamada franquia', hint: 'Final da home' },
                  ].map((t) => {
                    const on = homeTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setHomeTab(t.id as typeof homeTab)}
                        className={`flex-1 min-w-[140px] px-3 py-2 rounded-lg text-left transition-all ${on
                          ? 'bg-eagle-red/15 border border-eagle-red/30 text-white shadow-sm shadow-red-950/30'
                          : 'border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        }`}
                      >
                        <p className="text-sm font-heading font-semibold leading-tight">{t.label}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{t.hint}</p>
                      </button>
                    );
                  })}
                </div>

                {homeTab === 'hero' && (<>
                <div className="p-4 rounded-xl border border-zinc-800 bg-eagle-black/40 space-y-4">
                  <div>
                    <p className="text-sm font-heading font-semibold text-white">
                      Mídia principal (banner do topo)
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Escolha o que aparece na abertura da Home: vídeo, imagem única ou carrossel de imagens. Ideal para campanhas e promoções.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: 'video', label: 'Vídeo' },
                        { id: 'image', label: 'Imagem única' },
                        { id: 'carousel', label: 'Carrossel' },
                      ] as { id: HeroMediaType; label: string }[]
                    ).map((t) => {
                      const on = draft.home.heroMedia.type === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() =>
                            setDraft((d) => ({
                              ...d,
                              home: {
                                ...d.home,
                                heroMedia: { ...d.home.heroMedia, type: t.id },
                              },
                            }))
                          }
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${on
                            ? 'bg-eagle-red/15 border-eagle-red/40 text-white shadow-sm shadow-red-950/30'
                            : 'border-zinc-700/80 text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>

                  {draft.home.heroMedia.type === 'video' && (
                    <div className="space-y-3">
                      <VideoUploader
                        label="Vídeo do banner"
                        hint="Formato MP4 na horizontal (ex.: 1920x1080px)."
                        value={draft.home.heroMedia.videoUrl || draft.media.homeHeroVideo}
                        onChange={(url) =>
                          setDraft((d) => ({
                            ...d,
                            home: {
                              ...d.home,
                              heroMedia: { ...d.home.heroMedia, videoUrl: url },
                            },
                          }))
                        }
                      />
                      <div>
                        <label className={lbCls}>Ou cole a URL do vídeo</label>
                        <input
                          className={inCls}
                          placeholder="Deixe vazio para usar o vídeo da aba Mídias"
                          value={draft.home.heroMedia.videoUrl}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              home: {
                                ...d.home,
                                heroMedia: { ...d.home.heroMedia, videoUrl: e.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                  )}

                  {draft.home.heroMedia.type === 'image' && (
                    <ImageUploader
                      label="Imagem do banner"
                      hint="Dimensão recomendada: 1920x1080px"
                      aspect="16/9"
                      maxWidth="320px"
                      value={draft.home.heroMedia.imageUrl}
                      onChange={(url) =>
                        setDraft((d) => ({
                          ...d,
                          home: {
                            ...d.home,
                            heroMedia: { ...d.home.heroMedia, imageUrl: url },
                          },
                        }))
                      }
                    />
                  )}

                  {draft.home.heroMedia.type === 'carousel' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-zinc-500">
                          Imagens do carrossel:{' '}
                          <span className="text-zinc-300 font-semibold">
                            {draft.home.heroMedia.carouselImages.length}
                          </span>
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((d) => ({
                              ...d,
                              home: {
                                ...d.home,
                                heroMedia: {
                                  ...d.home.heroMedia,
                                  carouselImages: [...d.home.heroMedia.carouselImages, ''],
                                },
                              },
                            }))
                          }
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-eagle-red hover:bg-red-700 active:bg-red-800 text-white text-xs font-heading font-semibold ring-1 ring-red-500/30 hover:ring-red-400/40 transition-all"
                        >
                          <Plus size={14} strokeWidth={2.5} />
                          Adicionar imagem
                        </button>
                      </div>
                      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {draft.home.heroMedia.carouselImages.map((img, i) => (
                          <div
                            key={i}
                            className="relative p-3 rounded-xl border border-zinc-800 bg-eagle-black/50 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-eagle-gold">
                                Imagem {i + 1}
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  setDraft((d) => ({
                                    ...d,
                                    home: {
                                      ...d.home,
                                      heroMedia: {
                                        ...d.home.heroMedia,
                                        carouselImages: d.home.heroMedia.carouselImages.filter(
                                          (_, idx) => idx !== i,
                                        ),
                                      },
                                    },
                                  }))
                                }
                                title="Remover imagem"
                                aria-label={`Remover imagem ${i + 1}`}
                                className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            <ImageUploader
                              label=""
                              hint="Dimensão recomendada: 1920x1080px"
                              aspect="16/9"
                              value={img}
                              onChange={(url) =>
                                setDraft((d) => {
                                  const carouselImages = [...d.home.heroMedia.carouselImages];
                                  carouselImages[i] = url;
                                  return {
                                    ...d,
                                    home: {
                                      ...d.home,
                                      heroMedia: { ...d.home.heroMedia, carouselImages },
                                    },
                                  };
                                })
                              }
                            />
                          </div>
                        ))}
                      </div>
                      {draft.home.heroMedia.carouselImages.length === 0 && (
                        <p className="text-xs text-amber-500/90">
                          Adicione ao menos uma imagem — sem imagens, o site mostra o vídeo padrão.
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <p className="text-sm font-heading font-semibold text-white">
                    Texto principal (segundo hero)
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Bloco com título e subtítulo sobre a imagem de fundo. A imagem é trocada na aba Mídias (&quot;Home — fundo do segundo hero&quot;).
                  </p>
                </div>
                <div>
                  <label className={lbCls}>Eyebrow</label>
                  <input
                    className={inCls}
                    value={draft.home.hero.eyebrow}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        home: {
                          ...d.home,
                          hero: { ...d.home.hero, eyebrow: e.target.value },
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Título (parte antes do destaque)</label>
                  <input
                    className={inCls}
                    value={draft.home.hero.titleLine1}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        home: {
                          ...d.home,
                          hero: { ...d.home.hero, titleLine1: e.target.value },
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Título (destaque em gradiente)</label>
                  <input
                    className={inCls}
                    value={draft.home.hero.titleHighlight}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        home: {
                          ...d.home,
                          hero: {
                            ...d.home.hero,
                            titleHighlight: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Subtítulo</label>
                  <RichTextEditor
                    value={draft.home.hero.subtitle}
                    onChange={(html) =>
                      setDraft((d) => ({
                        ...d,
                        home: {
                          ...d.home,
                          hero: { ...d.home.hero, subtitle: html },
                        },
                      }))
                    }
                  />
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-eagle-black/40 space-y-4">
                  <div>
                    <p className="text-sm font-heading font-semibold text-white">
                      Aparência do segundo hero
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      Alinhamento do texto, enquadramento da imagem de fundo, máscara escura e cores.
                    </p>
                  </div>

                  <div>
                    <label className={lbCls}>Alinhamento do texto</label>
                    <div className="flex flex-wrap gap-2">
                      {(
                        [
                          { id: 'left', label: 'Esquerda' },
                          { id: 'center', label: 'Centro' },
                          { id: 'right', label: 'Direita' },
                        ] as { id: 'left' | 'center' | 'right'; label: string }[]
                      ).map((t) => {
                        const on = draft.home.secondHero.textAlign === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() =>
                              setDraft((d) => ({
                                ...d,
                                home: {
                                  ...d.home,
                                  secondHero: { ...d.home.secondHero, textAlign: t.id },
                                },
                              }))
                            }
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${on
                              ? 'bg-eagle-red/15 border-eagle-red/40 text-white shadow-sm shadow-red-950/30'
                              : 'border-zinc-700/80 text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                            }`}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className={lbCls}>Posição da imagem (foco do corte)</label>
                      <select
                        className={inCls}
                        value={draft.home.secondHero.objectPosition}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            home: {
                              ...d.home,
                              secondHero: {
                                ...d.home.secondHero,
                                objectPosition: e.target
                                  .value as typeof d.home.secondHero.objectPosition,
                              },
                            },
                          }))
                        }
                      >
                        <option value="center">Centro</option>
                        <option value="top">Topo</option>
                        <option value="bottom">Base</option>
                        <option value="left">Esquerda</option>
                        <option value="right">Direita</option>
                      </select>
                    </div>
                    <div>
                      <label className={lbCls}>Ajuste da imagem</label>
                      <select
                        className={inCls}
                        value={draft.home.secondHero.objectFit}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            home: {
                              ...d.home,
                              secondHero: {
                                ...d.home.secondHero,
                                objectFit: e.target
                                  .value as typeof d.home.secondHero.objectFit,
                              },
                            },
                          }))
                        }
                      >
                        <option value="cover">Preencher a tela (corta as bordas)</option>
                        <option value="contain">Mostrar a imagem inteira</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={draft.home.secondHero.overlayEnabled}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            home: {
                              ...d.home,
                              secondHero: {
                                ...d.home.secondHero,
                                overlayEnabled: e.target.checked,
                              },
                            },
                          }))
                        }
                        className="h-4 w-4 rounded border-zinc-600 bg-eagle-black accent-red-600"
                      />
                      <span className="text-sm text-zinc-300">
                        Aplicar máscara escura sobre a imagem (melhora a leitura do texto)
                      </span>
                    </label>
                    {draft.home.secondHero.overlayEnabled && (
                      <div>
                        <label className={lbCls}>
                          Intensidade da máscara:{' '}
                          <span className="text-eagle-gold font-semibold">
                            {draft.home.secondHero.overlayOpacity}%
                          </span>
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={5}
                          value={draft.home.secondHero.overlayOpacity}
                          onChange={(e) =>
                            setDraft((d) => ({
                              ...d,
                              home: {
                                ...d.home,
                                secondHero: {
                                  ...d.home.secondHero,
                                  overlayOpacity: Number(e.target.value),
                                },
                              },
                            }))
                          }
                          className="w-full max-w-sm accent-red-600"
                        />
                        <p className="text-[11px] text-zinc-500 mt-1">
                          0% = imagem original · 100% = totalmente escura. Valores altos deixam a foto escura demais.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 pt-1">
                    <ColorField
                      label="Cor do eyebrow"
                      value={draft.home.secondHero.eyebrowColor}
                      onChange={(c) =>
                        setDraft((d) => ({
                          ...d,
                          home: {
                            ...d.home,
                            secondHero: { ...d.home.secondHero, eyebrowColor: c },
                          },
                        }))
                      }
                    />
                    <ColorField
                      label="Cor do título"
                      value={draft.home.secondHero.titleColor}
                      onChange={(c) =>
                        setDraft((d) => ({
                          ...d,
                          home: {
                            ...d.home,
                            secondHero: { ...d.home.secondHero, titleColor: c },
                          },
                        }))
                      }
                    />
                    <ColorField
                      label="Cor do destaque do título"
                      value={draft.home.secondHero.highlightColor}
                      onChange={(c) =>
                        setDraft((d) => ({
                          ...d,
                          home: {
                            ...d.home,
                            secondHero: { ...d.home.secondHero, highlightColor: c },
                          },
                        }))
                      }
                    />
                    <ColorField
                      label="Cor do subtítulo"
                      value={draft.home.secondHero.subtitleColor}
                      onChange={(c) =>
                        setDraft((d) => ({
                          ...d,
                          home: {
                            ...d.home,
                            secondHero: { ...d.home.secondHero, subtitleColor: c },
                          },
                        }))
                      }
                    />
                  </div>
                </div>

                </>)}

                {homeTab === 'experience' && (<>
                <div>
                  <label className={lbCls}>Título linha 1</label>
                  <input
                    className={inCls}
                    value={draft.home.experience.titleLine1}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        home: {
                          ...d.home,
                          experience: {
                            ...d.home.experience,
                            titleLine1: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Título linha 2 (dourado)</label>
                  <input
                    className={inCls}
                    value={draft.home.experience.titleLine2}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        home: {
                          ...d.home,
                          experience: {
                            ...d.home.experience,
                            titleLine2: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Parágrafo</label>
                  <RichTextEditor
                    value={draft.home.experience.body}
                    onChange={(html) =>
                      setDraft((d) => ({
                        ...d,
                        home: {
                          ...d.home,
                          experience: {
                            ...d.home.experience,
                            body: html,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-zinc-500">
                    Itens da lista: <span className="text-zinc-300 font-semibold">{draft.home.experience.bullets.length}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        home: {
                          ...d.home,
                          experience: {
                            ...d.home.experience,
                            bullets: [...d.home.experience.bullets, ''],
                          },
                        },
                      }))
                    }
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-eagle-red hover:bg-red-700 active:bg-red-800 text-white text-xs font-heading font-semibold ring-1 ring-red-500/30 hover:ring-red-400/40 transition-all"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    Adicionar item
                  </button>
                </div>
                <div className="space-y-2">
                {draft.home.experience.bullets.map((b, i) => (
                  <div key={i} className="flex items-end gap-2">
                    <div className="flex-1 min-w-0">
                      <label className={lbCls}>Item {i + 1}</label>
                      <input
                        className={inCls}
                        value={b}
                        onChange={(e) =>
                          setDraft((d) => {
                            const bullets = [...d.home.experience.bullets];
                            bullets[i] = e.target.value;
                            return {
                              ...d,
                              home: {
                                ...d.home,
                                experience: { ...d.home.experience, bullets },
                              },
                            } as typeof d;
                          })
                        }
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft((d) => ({
                          ...d,
                          home: {
                            ...d.home,
                            experience: {
                              ...d.home.experience,
                              bullets: d.home.experience.bullets.filter((_, idx) => idx !== i),
                            },
                          },
                        }))
                      }
                      title="Remover item"
                      aria-label={`Remover item ${i + 1}`}
                      className="shrink-0 p-2.5 rounded-lg border border-zinc-700/80 text-zinc-500 hover:text-red-400 hover:border-red-700/40 hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
                </div>

                </>)}

                {homeTab === 'carousel' && (<>
                <div>
                  <label className={lbCls}>Título da seção</label>
                  <input
                    className={inCls}
                    value={draft.home.carousel.title}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        home: {
                          ...d.home,
                          carousel: { ...d.home.carousel, title: e.target.value },
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Nota de rodapé</label>
                  <input
                    className={inCls}
                    value={draft.home.carousel.footnote}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        home: {
                          ...d.home,
                          carousel: { ...d.home.carousel, footnote: e.target.value },
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-zinc-500">
                    Cards exibidos: <span className="text-zinc-300 font-semibold">{draft.home.workouts.length}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        home: {
                          ...d.home,
                          workouts: [
                            ...d.home.workouts,
                            { label: 'Novo treino', title: 'Título do treino', img: '' },
                          ],
                        },
                      }))
                    }
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-eagle-red hover:bg-red-700 active:bg-red-800 text-white text-xs font-heading font-semibold ring-1 ring-red-500/30 hover:ring-red-400/40 transition-all"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    Adicionar card
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {draft.home.workouts.map((w, i) => (
                  <div
                    key={i}
                    className="relative p-4 rounded-xl border border-zinc-800 bg-eagle-black/50 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-eagle-gold">
                        Card de treino {i + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            home: {
                              ...d.home,
                              workouts: d.home.workouts.filter((_, idx) => idx !== i),
                            },
                          }))
                        }
                        title="Remover card"
                        className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                        aria-label={`Remover card ${i + 1}`}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div>
                      <label className={lbCls}>Label lateral</label>
                      <input
                        className={inCls}
                        value={w.label}
                        onChange={(e) =>
                          setDraft((d) => {
                            const workouts = [...d.home.workouts];
                            workouts[i] = { ...workouts[i], label: e.target.value };
                            return { ...d, home: { ...d.home, workouts } };
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className={lbCls}>Título</label>
                      <input
                        className={inCls}
                        value={w.title}
                        onChange={(e) =>
                          setDraft((d) => {
                            const workouts = [...d.home.workouts];
                            workouts[i] = { ...workouts[i], title: e.target.value };
                            return { ...d, home: { ...d.home, workouts } };
                          })
                        }
                      />
                    </div>
                    <ImageUploader
                      label="Imagem do card"
                      hint="Dimensão recomendada: 760x960px"
                      value={w.img}
                      aspect="4/5"
                      onChange={(url) =>
                        setDraft((d) => {
                          const workouts = [...d.home.workouts];
                          workouts[i] = { ...workouts[i], img: url };
                          return { ...d, home: { ...d.home, workouts } };
                        })
                      }
                    />
                  </div>
                ))}
                </div>

                </>)}

                {homeTab === 'teaser' && (<>
                <div>
                  <label className={lbCls}>Eyebrow</label>
                  <input
                    className={inCls}
                    value={draft.home.franchiseTeaser.eyebrow}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        home: {
                          ...d.home,
                          franchiseTeaser: {
                            ...d.home.franchiseTeaser,
                            eyebrow: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Título (parte fixa)</label>
                  <input
                    className={inCls}
                    value={draft.home.franchiseTeaser.titlePart1}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        home: {
                          ...d.home,
                          franchiseTeaser: {
                            ...d.home.franchiseTeaser,
                            titlePart1: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Título (parte em gradiente)</label>
                  <input
                    className={inCls}
                    value={draft.home.franchiseTeaser.titleGradient}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        home: {
                          ...d.home,
                          franchiseTeaser: {
                            ...d.home.franchiseTeaser,
                            titleGradient: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Parágrafo</label>
                  <RichTextEditor
                    value={draft.home.franchiseTeaser.body}
                    onChange={(html) =>
                      setDraft((d) => ({
                        ...d,
                        home: {
                          ...d.home,
                          franchiseTeaser: {
                            ...d.home.franchiseTeaser,
                            body: html,
                          },
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Texto do botão</label>
                  <input
                    className={inCls}
                    value={draft.home.franchiseTeaser.cta}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        home: {
                          ...d.home,
                          franchiseTeaser: {
                            ...d.home.franchiseTeaser,
                            cta: e.target.value,
                          },
                        },
                      }))
                    }
                  />
                </div>
                </>)}

                <SectionSaveBar onSave={saveHome} label="Salvar página Home" />
              </Section>
            )}

            {active === 'about' && (
              <Section title="Sobre nós" subtitle="História, pilares e valores da marca">
                <div className="flex flex-wrap gap-2 -mt-2 mb-2 p-1 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
                  {[
                    { id: 'hero', label: 'Hero', hint: 'Topo da página' },
                    { id: 'story', label: 'Nossa história', hint: 'Texto narrativo' },
                    { id: 'pillars', label: 'Pilares', hint: 'Intro e títulos' },
                    { id: 'values', label: 'Missão · Visão · Valores', hint: '3 colunas' },
                  ].map((t) => {
                    const on = aboutTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setAboutTab(t.id as typeof aboutTab)}
                        className={`flex-1 min-w-[140px] px-3 py-2 rounded-lg text-left transition-all ${on
                          ? 'bg-eagle-red/15 border border-eagle-red/30 text-white shadow-sm shadow-red-950/30'
                          : 'border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        }`}
                      >
                        <p className="text-sm font-heading font-semibold leading-tight">{t.label}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{t.hint}</p>
                      </button>
                    );
                  })}
                </div>

                {aboutTab === 'hero' && (<>
                <div>
                  <label className={lbCls}>Hero — título</label>
                  <RichTextEditor
                    value={draft.about.heroTitle}
                    onChange={(html) =>
                      setDraft((d) => ({
                        ...d,
                        about: { ...d.about, heroTitle: html },
                      }))
                    }
                  />
                </div>
                <div className="max-w-sm">
                  <ColorField
                    label="Cor do título (sobre a imagem de fundo)"
                    value={draft.about.heroTitleColor}
                    onChange={(c) =>
                      setDraft((d) => ({
                        ...d,
                        about: { ...d.about, heroTitleColor: c },
                      }))
                    }
                  />
                </div>
                </>)}

                {aboutTab === 'story' && (<>
                <div>
                  <label className={lbCls}>Nossa história — título</label>
                  <input
                    className={inCls}
                    value={draft.about.storyTitle}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        about: { ...d.about, storyTitle: e.target.value },
                      }))
                    }
                  />
                </div>
                {draft.about.storyParagraphs.map((p, i) => (
                  <div key={i}>
                    <label className={lbCls}>História — parágrafo {i + 1}</label>
                    <RichTextEditor
                      value={p}
                      onChange={(html) =>
                        setDraft((d) => {
                          const storyParagraphs = [...d.about.storyParagraphs];
                          storyParagraphs[i] = html;
                          return {
                            ...d,
                            about: { ...d.about, storyParagraphs },
                          };
                        })
                      }
                    />
                  </div>
                ))}
                </>)}

                {aboutTab === 'pillars' && (<>
                <div>
                  <label className={lbCls}>Pilares — título da seção</label>
                  <input
                    className={inCls}
                    value={draft.about.pillarsTitle}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        about: { ...d.about, pillarsTitle: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Pilares — texto intro (minúsculas no site)</label>
                  <input
                    className={inCls}
                    value={draft.about.pillarsIntro}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        about: { ...d.about, pillarsIntro: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Pilares — headline</label>
                  <RichTextEditor
                    value={draft.about.pillarsHeadline}
                    onChange={(html) =>
                      setDraft((d) => ({
                        ...d,
                        about: { ...d.about, pillarsHeadline: html },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Pilares — texto final</label>
                  <RichTextEditor
                    value={draft.about.pillarsOutro}
                    onChange={(html) =>
                      setDraft((d) => ({
                        ...d,
                        about: { ...d.about, pillarsOutro: html },
                      }))
                    }
                  />
                </div>
                </>)}

                {aboutTab === 'values' && (<>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className={lbCls}>Missão — título</label>
                    <input
                      className={inCls}
                      value={draft.about.missionTitle}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          about: { ...d.about, missionTitle: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={lbCls}>Visão — título</label>
                    <input
                      className={inCls}
                      value={draft.about.visionTitle}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          about: { ...d.about, visionTitle: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={lbCls}>Valores — título</label>
                    <input
                      className={inCls}
                      value={draft.about.valuesTitle}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          about: { ...d.about, valuesTitle: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className={lbCls}>Missão — descrição</label>
                  <RichTextEditor
                    value={draft.about.missionDesc}
                    onChange={(html) =>
                      setDraft((d) => ({
                        ...d,
                        about: { ...d.about, missionDesc: html },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Visão — descrição</label>
                  <RichTextEditor
                    value={draft.about.visionDesc}
                    onChange={(html) =>
                      setDraft((d) => ({
                        ...d,
                        about: { ...d.about, visionDesc: html },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Valores — descrição</label>
                  <RichTextEditor
                    value={draft.about.valuesDesc}
                    onChange={(html) =>
                      setDraft((d) => ({
                        ...d,
                        about: { ...d.about, valuesDesc: html },
                      }))
                    }
                  />
                </div>
                </>)}

                <SectionSaveBar onSave={saveAbout} label="Salvar página Sobre" />
              </Section>
            )}

            {active === 'franchise' && (
              <Section title="Franquia" subtitle="Hero, investimento, suporte, números e formulário">
                <div className="flex flex-wrap gap-2 -mt-2 mb-2 p-1 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
                  {[
                    { id: 'hero', label: 'Hero', hint: 'Topo + CTA' },
                    { id: 'why', label: 'Por que investir', hint: 'Cards do diferencial' },
                    { id: 'support', label: 'Suporte', hint: 'Itens de apoio' },
                    { id: 'numbers', label: 'Números do negócio', hint: 'Investimento, lucro etc.' },
                    { id: 'form', label: 'Formulário', hint: 'Campos e opções' },
                  ].map((t) => {
                    const on = franchiseTab === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFranchiseTab(t.id as typeof franchiseTab)}
                        className={`flex-1 min-w-[140px] px-3 py-2 rounded-lg text-left transition-all ${on
                          ? 'bg-eagle-red/15 border border-eagle-red/30 text-white shadow-sm shadow-red-950/30'
                          : 'border border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                        }`}
                      >
                        <p className="text-sm font-heading font-semibold leading-tight">{t.label}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{t.hint}</p>
                      </button>
                    );
                  })}
                </div>

                {franchiseTab === 'hero' && (<>
                <div>
                  <label className={lbCls}>Eyebrow</label>
                  <input
                    className={inCls}
                    value={draft.franchise.heroEyebrow}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        franchise: {
                          ...d.franchise,
                          heroEyebrow: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Título (antes do destaque)</label>
                  <input
                    className={inCls}
                    value={draft.franchise.heroTitleBefore}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        franchise: {
                          ...d.franchise,
                          heroTitleBefore: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Título (destaque)</label>
                  <input
                    className={inCls}
                    value={draft.franchise.heroTitleHighlight}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        franchise: {
                          ...d.franchise,
                          heroTitleHighlight: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Parágrafo</label>
                  <RichTextEditor
                    value={draft.franchise.heroBody}
                    onChange={(html) =>
                      setDraft((d) => ({
                        ...d,
                        franchise: { ...d.franchise, heroBody: html },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Botão (âncora formulário)</label>
                  <input
                    className={inCls}
                    value={draft.franchise.heroCta}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        franchise: { ...d.franchise, heroCta: e.target.value },
                      }))
                    }
                  />
                </div>

                </>)}

                {franchiseTab === 'why' && (<>
                <div>
                  <label className={lbCls}>Título</label>
                  <input
                    className={inCls}
                    value={draft.franchise.whyTitle}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        franchise: { ...d.franchise, whyTitle: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Texto</label>
                  <RichTextEditor
                    value={draft.franchise.whyBody}
                    onChange={(html) =>
                      setDraft((d) => ({
                        ...d,
                        franchise: { ...d.franchise, whyBody: html },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-zinc-500">
                    Cards: <span className="text-zinc-300 font-semibold">{draft.franchise.whyCards.length}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        franchise: {
                          ...d.franchise,
                          whyCards: [
                            ...d.franchise.whyCards,
                            { title: 'Novo card', desc: '', icon: 'star' },
                          ],
                        },
                      }))
                    }
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-eagle-red hover:bg-red-700 active:bg-red-800 text-white text-xs font-heading font-semibold ring-1 ring-red-500/30 hover:ring-red-400/40 transition-all"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    Adicionar card
                  </button>
                </div>
                {draft.franchise.whyCards.map((card, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-eagle-gold font-semibold">Card {i + 1}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            franchise: {
                              ...d.franchise,
                              whyCards: d.franchise.whyCards.filter((_, idx) => idx !== i),
                            },
                          }))
                        }
                        title="Remover card"
                        aria-label={`Remover card ${i + 1}`}
                        className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <CardIconSelect
                      value={card.icon}
                      fallback={WHY_FALLBACK_ICONS[i] ?? TrendingUp}
                      onChange={(icon) =>
                        setDraft((d) => {
                          const whyCards = [...d.franchise.whyCards];
                          whyCards[i] = { ...whyCards[i], icon };
                          return {
                            ...d,
                            franchise: { ...d.franchise, whyCards },
                          };
                        })
                      }
                    />
                    <div>
                      <label className={lbCls}>Título</label>
                      <input
                        className={inCls}
                        value={card.title}
                        onChange={(e) =>
                          setDraft((d) => {
                            const whyCards = [...d.franchise.whyCards];
                            whyCards[i] = { ...whyCards[i], title: e.target.value };
                            return {
                              ...d,
                              franchise: { ...d.franchise, whyCards },
                            };
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className={lbCls}>Descrição</label>
                      <RichTextEditor
                        value={card.desc}
                        onChange={(html) =>
                          setDraft((d) => {
                            const whyCards = [...d.franchise.whyCards];
                            whyCards[i] = { ...whyCards[i], desc: html };
                            return {
                              ...d,
                              franchise: { ...d.franchise, whyCards },
                            };
                          })
                        }
                      />
                    </div>
                  </div>
                ))}

                </>)}

                {franchiseTab === 'support' && (<>
                <div>
                  <label className={lbCls}>Título</label>
                  <input
                    className={inCls}
                    value={draft.franchise.supportTitle}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        franchise: {
                          ...d.franchise,
                          supportTitle: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Parágrafo</label>
                  <RichTextEditor
                    value={draft.franchise.supportBody}
                    onChange={(html) =>
                      setDraft((d) => ({
                        ...d,
                        franchise: {
                          ...d.franchise,
                          supportBody: html,
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-zinc-500">
                    Itens de suporte: <span className="text-zinc-300 font-semibold">{draft.franchise.supportItems.length}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        franchise: {
                          ...d.franchise,
                          supportItems: [
                            ...d.franchise.supportItems,
                            { title: 'Novo item', desc: '', icon: 'check-circle' },
                          ],
                        },
                      }))
                    }
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-eagle-red hover:bg-red-700 active:bg-red-800 text-white text-xs font-heading font-semibold ring-1 ring-red-500/30 hover:ring-red-400/40 transition-all"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    Adicionar item
                  </button>
                </div>
                {draft.franchise.supportItems.map((item, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-eagle-gold font-semibold">
                        Item suporte {i + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            franchise: {
                              ...d.franchise,
                              supportItems: d.franchise.supportItems.filter((_, idx) => idx !== i),
                            },
                          }))
                        }
                        title="Remover item"
                        aria-label={`Remover item ${i + 1}`}
                        className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <CardIconSelect
                      value={item.icon}
                      fallback={SUPPORT_FALLBACK_ICONS[i] ?? MapPin}
                      onChange={(icon) =>
                        setDraft((d) => {
                          const supportItems = [...d.franchise.supportItems];
                          supportItems[i] = { ...supportItems[i], icon };
                          return {
                            ...d,
                            franchise: { ...d.franchise, supportItems },
                          };
                        })
                      }
                    />
                    <div>
                      <label className={lbCls}>Título</label>
                      <input
                        className={inCls}
                        value={item.title}
                        onChange={(e) =>
                          setDraft((d) => {
                            const supportItems = [...d.franchise.supportItems];
                            supportItems[i] = {
                              ...supportItems[i],
                              title: e.target.value,
                            };
                            return {
                              ...d,
                              franchise: { ...d.franchise, supportItems },
                            };
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className={lbCls}>Descrição</label>
                      <RichTextEditor
                        value={item.desc}
                        onChange={(html) =>
                          setDraft((d) => {
                            const supportItems = [...d.franchise.supportItems];
                            supportItems[i] = {
                              ...supportItems[i],
                              desc: html,
                            };
                            return {
                              ...d,
                              franchise: { ...d.franchise, supportItems },
                            };
                          })
                        }
                      />
                    </div>
                  </div>
                ))}

                </>)}

                {franchiseTab === 'numbers' && (<>
                <div>
                  <label className={lbCls}>Título da caixa</label>
                  <input
                    className={inCls}
                    value={draft.franchise.numbersTitle}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        franchise: {
                          ...d.franchise,
                          numbersTitle: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-zinc-500">
                    Indicadores: <span className="text-zinc-300 font-semibold">{draft.franchise.numbers.length}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        franchise: {
                          ...d.franchise,
                          numbers: [...d.franchise.numbers, { label: 'Novo indicador', value: '' }],
                        },
                      }))
                    }
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-eagle-red hover:bg-red-700 active:bg-red-800 text-white text-xs font-heading font-semibold ring-1 ring-red-500/30 hover:ring-red-400/40 transition-all"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    Adicionar indicador
                  </button>
                </div>
                {draft.franchise.numbers.map((n, i) => (
                  <div key={i} className="p-4 rounded-xl border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-eagle-gold font-semibold">Indicador {i + 1}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            franchise: {
                              ...d.franchise,
                              numbers: d.franchise.numbers.filter((_, idx) => idx !== i),
                            },
                          }))
                        }
                        title="Remover indicador"
                        aria-label={`Remover indicador ${i + 1}`}
                        className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className={lbCls}>Rótulo</label>
                        <input
                          className={inCls}
                          value={n.label}
                          onChange={(e) =>
                            setDraft((d) => {
                              const numbers = [...d.franchise.numbers];
                              numbers[i] = { ...numbers[i], label: e.target.value };
                              return { ...d, franchise: { ...d.franchise, numbers } };
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className={lbCls}>Valor</label>
                        <input
                          className={inCls}
                          value={n.value}
                          onChange={(e) =>
                            setDraft((d) => {
                              const numbers = [...d.franchise.numbers];
                              numbers[i] = { ...numbers[i], value: e.target.value };
                              return { ...d, franchise: { ...d.franchise, numbers } };
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div>
                  <label className={lbCls}>Disclaimer</label>
                  <RichTextEditor
                    value={draft.franchise.numbersDisclaimer}
                    onChange={(html) =>
                      setDraft((d) => ({
                        ...d,
                        franchise: {
                          ...d.franchise,
                          numbersDisclaimer: html,
                        },
                      }))
                    }
                  />
                </div>

                </>)}

                {franchiseTab === 'form' && (<>
                <div>
                  <label className={lbCls}>Título</label>
                  <input
                    className={inCls}
                    value={draft.franchise.formTitle}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        franchise: { ...d.franchise, formTitle: e.target.value },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Subtítulo</label>
                  <RichTextEditor
                    value={draft.franchise.formSubtitle}
                    onChange={(html) =>
                      setDraft((d) => ({
                        ...d,
                        franchise: {
                          ...d.franchise,
                          formSubtitle: html,
                        },
                      }))
                    }
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {(
                    [
                      'labelName',
                      'labelEmail',
                      'labelPhone',
                      'labelCity',
                      'labelCapital',
                    ] as const
                  ).map((key) => (
                    <div key={key}>
                      <label className={lbCls}>
                        Rótulo — {key.replace('label', '')}
                      </label>
                      <input
                        className={inCls}
                        value={draft.franchise[key]}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            franchise: {
                              ...d.franchise,
                              [key]: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {(
                    [
                      ['placeholderName'],
                      ['placeholderEmail'],
                      ['placeholderPhone'],
                      ['placeholderCity'],
                    ] as const
                  ).map(([key]) => (
                    <div key={key}>
                      <label className={lbCls}>Placeholder — {key}</label>
                      <input
                        className={inCls}
                        value={draft.franchise[key]}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            franchise: {
                              ...d.franchise,
                              [key]: e.target.value,
                            },
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className={lbCls}>Select capital — placeholder</label>
                  <input
                    className={inCls}
                    value={draft.franchise.selectCapitalPlaceholder}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        franchise: {
                          ...d.franchise,
                          selectCapitalPlaceholder: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-3 pt-2">
                  <p className="text-xs text-zinc-500">
                    Opções de capital: <span className="text-zinc-300 font-semibold">{draft.franchise.capitalOptions.length}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        franchise: {
                          ...d.franchise,
                          capitalOptions: [
                            ...d.franchise.capitalOptions,
                            { value: `opt-${d.franchise.capitalOptions.length + 1}`, label: 'Nova opção' },
                          ],
                        },
                      }))
                    }
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-eagle-red hover:bg-red-700 active:bg-red-800 text-white text-xs font-heading font-semibold ring-1 ring-red-500/30 hover:ring-red-400/40 transition-all"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    Adicionar opção
                  </button>
                </div>
                {draft.franchise.capitalOptions.map((opt, i) => (
                  <div key={i} className="p-4 rounded-xl border border-zinc-800 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-eagle-gold font-semibold">Opção {i + 1}</p>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((d) => ({
                            ...d,
                            franchise: {
                              ...d.franchise,
                              capitalOptions: d.franchise.capitalOptions.filter((_, idx) => idx !== i),
                            },
                          }))
                        }
                        title="Remover opção"
                        aria-label={`Remover opção ${i + 1}`}
                        className="p-1 rounded-md text-zinc-500 hover:text-red-400 hover:bg-red-950/30 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className={lbCls}>Value (interno)</label>
                        <input
                          className={inCls}
                          value={opt.value}
                          onChange={(e) =>
                            setDraft((d) => {
                              const capitalOptions = [...d.franchise.capitalOptions];
                              capitalOptions[i] = { ...capitalOptions[i], value: e.target.value };
                              return { ...d, franchise: { ...d.franchise, capitalOptions } };
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className={lbCls}>Texto exibido</label>
                        <input
                          className={inCls}
                          value={opt.label}
                          onChange={(e) =>
                            setDraft((d) => {
                              const capitalOptions = [...d.franchise.capitalOptions];
                              capitalOptions[i] = { ...capitalOptions[i], label: e.target.value };
                              return { ...d, franchise: { ...d.franchise, capitalOptions } };
                            })
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div>
                  <label className={lbCls}>Botão enviar</label>
                  <input
                    className={inCls}
                    value={draft.franchise.submitButton}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        franchise: {
                          ...d.franchise,
                          submitButton: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div>
                  <label className={lbCls}>Mensagem após envio (toast no site)</label>
                  <RichTextEditor
                    value={draft.franchise.formSuccessMessage}
                    onChange={(html) =>
                      setDraft((d) => ({
                        ...d,
                        franchise: {
                          ...d.franchise,
                          formSuccessMessage: html,
                        },
                      }))
                    }
                  />
                </div>
                </>)}

                <SectionSaveBar onSave={saveFranchise} label="Salvar página Franquia" />
              </Section>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={resetOpen}
        onCancel={() => setResetOpen(false)}
        onConfirm={handleConfirmReset}
        title="Restaurar conteúdo padrão?"
        description="Todos os textos voltam ao original neste painel. Para atualizar o site público, use Salvar em cada seção depois de restaurar, se necessário."
        confirmLabel="Sim, restaurar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
}
