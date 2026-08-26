/**
 * Glifo do Instagram nas cores da marca.
 *
 * O ícone do `lucide-react` é monocromático (traço único) e não aceita o
 * degradê oficial — daí o SVG próprio. O `id` do gradiente é único por
 * instância porque `id` duplicado no documento faz o navegador reaproveitar o
 * primeiro, e o segundo ícone sairia sem cor.
 */
import { useId } from 'react';

export function InstagramIcon({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const gradientId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="24" x2="24" y2="0">
          <stop offset="0%" stopColor="#FFC947" />
          <stop offset="25%" stopColor="#FF7A28" />
          <stop offset="50%" stopColor="#F0326E" />
          <stop offset="75%" stopColor="#C32AA3" />
          <stop offset="100%" stopColor="#7B2FF7" />
        </linearGradient>
      </defs>
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="6"
        fill={`url(#${gradientId})`}
      />
      <circle
        cx="12"
        cy="12"
        r="4.4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.9"
      />
      <circle cx="17.4" cy="6.6" r="1.25" fill="#fff" />
    </svg>
  );
}
