import {
  Facebook,
  Globe,
  Instagram,
  Linkedin,
  type LucideIcon,
  MessageCircle,
  Music2,
  Send,
  Twitter,
  Youtube,
} from 'lucide-react';

export type SocialPlatform = {
  value: string;
  label: string;
  icon: LucideIcon;
};

/** Plataformas suportadas no rodapé. Adicionar nova = incluir aqui. */
export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
  { value: 'twitter', label: 'X (Twitter)', icon: Twitter },
  { value: 'tiktok', label: 'TikTok', icon: Music2 },
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'telegram', label: 'Telegram', icon: Send },
  { value: 'other', label: 'Outro (link)', icon: Globe },
];

/** Ícone da plataforma; fallback Globe se valor desconhecido. */
export function resolveSocialIcon(platform: string): LucideIcon {
  return (
    SOCIAL_PLATFORMS.find((p) => p.value === platform)?.icon ?? Globe
  );
}

export function resolveSocialLabel(platform: string): string {
  return SOCIAL_PLATFORMS.find((p) => p.value === platform)?.label ?? platform;
}

/**
 * URL pronta para `href`.
 *
 * O painel aceita o endereço colado como veio ("instagram.com/eagle"), e sem
 * protocolo o navegador trata isso como caminho relativo — o link levaria para
 * `meusite.com.br/instagram.com/eagle`. Aqui o `https://` entra quando falta.
 */
export function resolveSocialHref(url: string): string {
  const value = url.trim();
  if (!value) return '';
  // `mailto:`, `tel:` e afins passam intactos.
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
  return `https://${value.replace(/^\/+/, '')}`;
}
