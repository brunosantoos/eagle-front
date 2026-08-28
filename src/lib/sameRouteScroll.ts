import type { MouseEvent } from 'react';

/**
 * Rolagem ao clicar num link que aponta para a página em que já se está.
 *
 * O `Layout` sobe a página quando o `pathname` muda. Clicar no logo (ou em
 * "Início") estando na home não muda rota nenhuma, então o efeito não roda e o
 * clique não faz nada — o cursor vira mãozinha e a página fica parada, que foi
 * a reclamação do cliente. Aqui o próprio link faz a rolagem.
 */
export function scrollTopIfSamePath(currentPath: string, targetPath: string) {
  return (event: MouseEvent<HTMLAnchorElement>) => {
    if (currentPath !== targetPath) return;
    event.preventDefault();
    const reduceMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };
}
