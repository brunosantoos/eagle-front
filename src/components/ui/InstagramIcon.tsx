/**
 * Glifo do Instagram nas cores da marca.
 *
 * O ícone do `lucide-react` é monocromático (traço único) e não aceita o
 * degradê oficial — daí o SVG próprio. O `id` do gradiente é único por
 * instância porque `id` duplicado no documento faz o navegador reaproveitar o
 * primeiro, e o segundo ícone sairia sem cor.
 *
 * O desenho é o do app: quadrado arredondado com o degradê saindo do amarelo
 * (canto inferior esquerdo) para o roxo (canto superior direito), moldura
 * interna arredondada, lente e o ponto do flash. Feito em vetor de propósito —
 * PNG/JPG de banco de imagem chega com a transparência achatada (o xadrez vem
 * junto) e some do ar quando o host bloqueia hotlink.
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
        x="1.5"
        y="1.5"
        width="21"
        height="21"
        rx="6.4"
        fill={`url(#${gradientId})`}
      />
      {/* Moldura interna — é ela que dá a leitura de "app" ao ícone. */}
      <rect
        x="5.6"
        y="5.6"
        width="12.8"
        height="12.8"
        rx="4"
        fill="none"
        stroke="#fff"
        strokeWidth="1.7"
      />
      <circle
        cx="12"
        cy="12"
        r="3.35"
        fill="none"
        stroke="#fff"
        strokeWidth="1.7"
      />
      <circle cx="16.35" cy="7.65" r="1.05" fill="#fff" />
    </svg>
  );
}
