import {
  Award,
  BarChart3,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  DollarSign,
  Dumbbell,
  GraduationCap,
  Handshake,
  Heart,
  Headphones,
  LineChart,
  type LucideIcon,
  MapPin,
  Megaphone,
  Rocket,
  Shield,
  Star,
  Target,
  TrendingUp,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';

/**
 * Ícones disponíveis para os cards do Admin (Franquia — "Por que investir" e "Suporte").
 * O value é salvo no siteContent; '' significa "automático" (fallback por posição,
 * compatível com cards criados antes do campo existir).
 */
export const CARD_ICON_OPTIONS: { value: string; label: string }[] = [
  { value: 'trending-up', label: 'Crescimento (seta)' },
  { value: 'line-chart', label: 'Gráfico de linha' },
  { value: 'bar-chart', label: 'Gráfico de barras' },
  { value: 'dollar-sign', label: 'Cifrão' },
  { value: 'building', label: 'Prédio' },
  { value: 'handshake', label: 'Aperto de mãos' },
  { value: 'map-pin', label: 'Localização' },
  { value: 'graduation-cap', label: 'Treinamento' },
  { value: 'megaphone', label: 'Marketing' },
  { value: 'users', label: 'Pessoas' },
  { value: 'heart', label: 'Coração' },
  { value: 'star', label: 'Estrela' },
  { value: 'shield', label: 'Escudo' },
  { value: 'award', label: 'Prêmio' },
  { value: 'target', label: 'Alvo' },
  { value: 'dumbbell', label: 'Halter' },
  { value: 'zap', label: 'Raio' },
  { value: 'clock', label: 'Relógio' },
  { value: 'check-circle', label: 'Check' },
  { value: 'briefcase', label: 'Maleta' },
  { value: 'wrench', label: 'Ferramenta' },
  { value: 'headphones', label: 'Suporte (fone)' },
  { value: 'rocket', label: 'Foguete' },
];

export const CARD_ICON_MAP: Record<string, LucideIcon> = {
  'trending-up': TrendingUp,
  'line-chart': LineChart,
  'bar-chart': BarChart3,
  'dollar-sign': DollarSign,
  building: Building2,
  handshake: Handshake,
  'map-pin': MapPin,
  'graduation-cap': GraduationCap,
  megaphone: Megaphone,
  users: Users,
  heart: Heart,
  star: Star,
  shield: Shield,
  award: Award,
  target: Target,
  dumbbell: Dumbbell,
  zap: Zap,
  clock: Clock,
  'check-circle': CheckCircle2,
  briefcase: Briefcase,
  wrench: Wrench,
  headphones: Headphones,
  rocket: Rocket,
};

/** Resolve o ícone salvo; quando vazio/desconhecido usa o fallback (comportamento antigo por posição). */
export function resolveCardIcon(name: string, fallback: LucideIcon): LucideIcon {
  return (name && CARD_ICON_MAP[name]) || fallback;
}
