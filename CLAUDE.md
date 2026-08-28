# Eagle Center Fitness — Frontend (CLAUDE.md)

Site público + painel admin (React 18 + Vite + Tailwind v4 + tRPC react-query).

API vive em repo separado (`eagle-back`). Os tipos do tRPC vêm de um **git submodule** em `shared/eagle-back/` apontando para esse repo.

## Setup

```bash
git clone <url-deste-repo> eagle-front
cd eagle-front
git submodule update --init --recursive
pnpm install
pnpm dev          # Vite dev server (porta 3000)
```

Backend deve estar rodando (em dev: `http://localhost:3001`). O CORS do back é **aberto** — aceita
qualquer origem com credenciais, então não há origem para cadastrar. Configurar via `.env`:

```env
VITE_API_URL=http://localhost:3001/trpc
VITE_BACKEND_URL=http://localhost:3001
```

Em produção (Apache na frente, dois domínios separados):

```env
VITE_API_URL=https://api.eagleacademia.com.br/trpc
VITE_BACKEND_URL=https://api.eagleacademia.com.br
```

## Atualizar tipos do back

Quando o `eagle-back` muda algo no router/tipos:

```bash
git submodule update --remote shared/eagle-back
git add shared/eagle-back
git commit -m "chore: bump backend types"
```

Sem isso, o front continua com os tipos antigos no IDE.

## Build

```bash
pnpm build                # tsc + vite build
pnpm exec tsc --noEmit    # só typecheck
```

Build precisa do submodule presente — sem ele `src/lib/trpc.ts` quebra na resolução do `AppRouter`.

## Convenções

- UI em PT-BR. Identifiers em inglês.
- Tailwind v4 (`@theme` em `index.css`). Cores brand: `eagle-black`, `eagle-red`, `eagle-gold`, `eagle-light`, `eagle-muted`.
- Fontes: `font-sans` (Inter), `font-heading` (Montserrat), `font-vonique` (display Eagle).
- Forms admin: classes compartilhadas `inCls` / `taCls` / `lbCls` no topo de `AdminDashboard.tsx`.
- Section card: componente `<Section title subtitle>` com linha gradient red no topo.
- Save bar: `<SectionSaveBar onSave label>` — botão vermelho com ring + dot amber pulsante.
- Role badges: admin `bg-eagle-red/15 text-eagle-gold`, editor `bg-blue-500/15 text-blue-200`, user `bg-emerald-500/15 text-emerald-200`.
- Rótulo de campo no admin: `<FieldHead label path />` (não `<label className={lbCls}>`) — traz junto o botão de formatação do campo.
- Sliders de config: componente `SliderField` (topo de `AdminDashboard.tsx`); cores: `ColorField` (valor `''` = padrão do site).
- Rodapé: contato com campo vazio simplesmente não aparece — é assim que se oculta telefone/e-mail/endereço/rede social.
- Carrossel da Home é configurável em `content.home.carousel` (cores, tamanho de fonte dos cards, véu branco e degradê lateral). Avança sozinho a cada 3s (`CAROUSEL_AUTOPLAY_MS` em `Home.tsx`), pausando com o ponteiro em cima, com a aba em segundo plano, por 8s depois de uma ação da pessoa e para `prefers-reduced-motion`. O passo é medido no DOM (largura do card + gap), não um número fixo — é o que faz andar exatamente uma imagem em qualquer tela.
- Botão só ganha mãozinha por causa da regra em `index.css` (`button:not(:disabled)`); o navegador não põe `cursor: pointer` em `<button>`, só em link.

## Painel admin — seções por role

| ID | Label | Roles |
|----|-------|-------|
| `nav-footer` | Menu e rodapé | admin, editor |
| `home` | Home | admin, editor |
| `about` | Sobre | admin, editor |
| `franchise` | Franquia | admin, editor |
| `media` | Mídias | admin, editor |
| `leads` | Leads e contatos | admin, user |
| `users` | Usuários | admin |
| `email` | E-mail | admin |
| `storage` | Armazenamento | admin |

Gating: `AdminAuthProvider` expõe `role`; `AdminDashboard` filtra `allowedSections`; `AdminUsersProvider.list.useQuery` tem `enabled: role === 'admin'` pra evitar 403.

## Padrões importantes

- Não amend commits — sempre commit novo.
- Não usar `git add -A` — adicione arquivos por nome.
- Não commitar `.env`.
- Optimistic updates: sempre que mutation altera lista visível, use `useUtils().<router>.<query>.setData()` em `onMutate` + rollback em `onError` + `invalidate` em `onSettled`.
- tRPC `onMutate` typing quirk (v11): `variables` aparece como `void | Partial<Input>`. Workaround: cast com `as { ... }` dentro da callback.

## Uploads e URLs de mídia

Componente reutilizável `src/components/admin/ImageUploader.tsx`. NÃO mostra URL pro usuário — só preview + botão trocar + "Recortar imagem". Upload automático ao escolher arquivo, via `src/lib/upload.ts` (`uploadFile`) que chama `POST /api/upload` no back.

**Compressão: o upload não mexe na qualidade.** `src/lib/imageCompress.ts` só entra como rede de
segurança acima de **15 MB** (reduz para 4500px em WebP q95, para o upload não travar); abaixo disso
a imagem sobe exatamente como o cliente escolheu. O backend segue a mesma regra
(`eagle-back/src/lib/imageOptimize.ts`).

Antes as duas pontas comprimiam sempre, em 2560px q82 — perda dupla sobre um arquivo que já vinha
comprimido da câmera, e o cliente via a diferença. Recomprimir passou a ser um ato explícito, no
botão "Comprimir imagens já enviadas" (Admin > Mídias).

`uploadFileDetailed()` devolve `originalSize`/`finalSize`/`compressed`; `describeCompression()` monta
o texto "9.15 MB → 180 KB (-98%)" mostrado no painel, e agora quase sempre não aparece — é o
esperado. Falha em qualquer etapa manda o arquivo original.

**Regra:** o conteúdo grava sempre o caminho **relativo** (`/uploads/<arquivo>`). O host do backend entra
só no render, com `resolveMediaUrl()` de `src/lib/mediaUrl.ts`. Todo `<img>`/`<video>` que exibe mídia do
`SiteContent` passa por ela — inclusive previews do admin. Gravar URL absoluta quebra o site quando o
domínio muda (era a causa do bug "mídias não replicam").

## Comprimir o acervo já enviado

Botão **Comprimir imagens já enviadas** em Admin > Mídias (`UploadsOptimizer` em
`AdminMediaPanel.tsx`), sobre o router `mediaLibrary` (`contentProcedure`).

Dois passos de propósito — **Analisar** (simulação, não escreve nada) e **Comprimir agora** —
porque reescrever imagem não tem desfazer. Nome e extensão são preservados: o `SiteContent` guarda o
caminho do arquivo, e trocar a extensão quebraria as referências do site.

O mesmo trabalho pela linha de comando: `make uploads-optimize` / `make uploads-optimize-apply`.
A lógica é única, em `eagle-back/src/lib/optimizeUploads.ts`.

## Armazenamento de mídia

`src/pages/admin/AdminStoragePanel.tsx` (seção `storage`, só admin) — escolhe entre disco do
servidor (padrão) e bucket S3/DigitalOcean Spaces, com chaves cadastradas no painel e botão
"Testar conexão". Sem bucket configurado, nada muda: upload continua indo para `/uploads`.

`resolveMediaUrl`/`toStoredMediaUrl` só reescrevem `/uploads/...` quando o host é o do backend
(ou localhost). URL de bucket é guardada e exibida inteira — inclusive se a pasta lá dentro se
chamar "uploads".

## Editor de recorte

`src/components/admin/ImageCropModal.tsx` — canvas nativo, sem lib externa e sem processamento no
servidor: arrasta/zoom dentro da moldura, presets de proporção (original, 16:9, 4:3, 1:1, 4:5, 9:16),
guias de terços, prévia com máscara. Gera WebP (fallback JPEG) q95 com no máximo 3200px de largura e
sobe como arquivo novo — recorte é reencode inevitável, então o teto e a qualidade são altos. Disponível em qualquer `ImageUploader` (Home/carrossel/hero) e na aba Mídias
(que cobre as imagens de Sobre).

## Configuração de e-mail

`src/pages/admin/AdminEmailPanel.tsx` (seção `email`, só admin) — chave da API do Resend, remetente,
e-mail da equipe, reply-to e URL do site ficam no **banco**, cadastrados pelo painel (env só como
fallback no back). A chave nunca volta do servidor em texto puro: o painel mostra `••••1234` e a
origem (painel/env). Campo de chave vazio no save = mantém a atual; há botão "Remover chave" e
"Enviar teste" que devolve o erro cru do Resend.

## Páginas legais

`/privacidade` (`PrivacyPolicy.tsx`) e `/termos` (`TermsOfUse.tsx`) — conteúdo em
`content.privacyPolicy` e `content.termsOfUse`, editado no Admin em "Menu e rodapé" (abas
"Política de privacidade" e "Termos de uso").

## Tipografia

Catálogo em `src/lib/fonts.ts` — **adicionar fonte = incluir uma entrada em `FONT_CATALOG`**, nada
mais. Todas as fontes da lista têm acentuação completa (`subset=latin,latin-ext`); é o requisito que
originou o catálogo.

- `content.typography` (`heading` / `body` / `display`) guarda ids do catálogo, editado em
  **Admin > Tipografia** (`AdminTypographyPanel.tsx`).
- `useSiteFonts()` (chamado no `SiteContentProvider`) escreve `--font-sans`, `--font-heading` e
  `--font-vonique` no elemento raiz — as mesmas variáveis do `@theme`, então `font-sans`,
  `font-heading` e `font-vonique` seguem a configuração sem tocar em componente nenhum.
- **Nenhuma fonte é carregada de entrada.** `ensureFontsLoaded()` injeta o `<link>` sob demanda;
  `collectUsedFontIds()` varre o conteúdo procurando `font-family:` para descobrir o que a página
  precisa. Inter e Montserrat são exceção: vêm por `<link>` estático no `index.html` (estão em toda
  página) e já entram marcadas como carregadas.
- No backend o campo é **opcional** no zod — conteúdo salvo antes desta versão continua válido e o
  `mergeSiteContent` completa com o padrão.

## Formatação por campo de texto

Todo campo de texto do site tem fonte, tamanho, espessura, **caixa**, alinhamento, cor, espaçamento
entre letras e altura da linha — editáveis campo a campo no painel.

- **Onde fica:** `content.textStyles`, um mapa `caminho do campo -> TextStyle`
  (`about.pillarsIntro`, `home.workouts.0.title`). Mesmo desenho do `mediaEffects`: mapa livre, e por
  isso precisa de normalização própria no `mergeSiteContent` — o deepMerge só copia chave que já
  existe no default (`{}`).
- **No site:** `<SiteText path="about.pillarsIntro" as="p" className="..." />`
  (`components/site/SiteText.tsx`). O `path` busca o texto **e** a formatação, então não há como os
  dois apontarem para campos diferentes. Use `html` para campo de rich text e `value` quando o texto
  vem de um valor derivado (item de lista, `useMemo`).
- **No painel:** `<FieldHead label="..." path="..." />` (`components/admin/FieldHead.tsx`) troca o
  antigo `<label className={lbCls}>` e desenha o botão "Formatar" ao lado do rótulo. A leitura e a
  escrita do mapa vêm do `TextStyleDraftProvider`, que envolve o `AdminDashboard` inteiro —
  o formulário continua escrevendo só o texto.
- **Campo sem `path` não ganha botão.** Placeholder de input, `<option>` de select e texto de toast
  não são elementos na página: não há onde aplicar `style`.
- **Regra de precedência:** classe do Tailwind é a aparência padrão, `style` inline do campo ganha
  dela. É assim que a caixa "Como escrito" vence um `uppercase` chumbado no código — era o bug do
  "edito o O maiúsculo e o site mostra minúsculo" (`About.tsx`, `pillarsIntro`).
  Em `SiteText` o `style` recebido por prop é **base**: a formatação do campo vem depois e ganha,
  porque é a configuração mais específica (cores de seção do segundo hero e do carrossel entram
  por ali).
- **Tamanho é um número só.** O valor vale no desktop e vira `clamp()` em `lib/textStyle.ts`,
  encolhendo até 65% (piso de 12px) entre 1280px e 360px de viewport. Pedir dois tamanhos por campo
  seria pedir para o cliente errar o mobile.
- **Publicação:** `textStyles` entra em **todos** os saves de conteúdo do `AdminDashboard`. A
  formatação é editada espalhada pelas seções; publicar só a seção ativa deixaria alteração para trás.
- **Fontes:** nada a fazer. `collectUsedFontIds()` varre o JSON procurando `"<id>"`, e o id salvo em
  `textStyles[].font` já cai nessa varredura.

## RichTextEditor

Tiptap com `StarterKit` + `TextAlign` + `TextStyle` + `FontFamily` + `Underline`. Font picker custom
lista o `FONT_CATALOG` agrupado por categoria, cada nome desenhado na própria fonte.

**É memoizado** (`memo` com comparador em `value`/`placeholder`, `onChange` numa ref). Sem isso cada
tecla digitada rodava `getHTML()` — serialização do documento inteiro — em todos os editores da
seção, e era a causa da lentidão do painel. `ImageUploader` e `VideoUploader` são memoizados pelo
mesmo motivo. Se for passar callback novo por render, ele **não** pode entrar no comparador.

## Editor de recorte — proporção do campo

`ImageCropModal` recebe `aspect` com a proporção **exata** do espaço onde a imagem aparece no site e
monta o preset "Campo do site", pré-selecionado. As proporções reais vivem em `FIELD_META.framing`
(`AdminMediaPanel.tsx`) e nos `aspect=` dos `ImageUploader`.

Antes o modal arredondava a proporção para o preset genérico mais próximo (16:9, 4:3, 1:1, 4:5,
9:16) — um campo 3:4 abria em 4:5 e o enquadramento nunca fechava com o site. **Ao mudar um layout
que exibe mídia, atualize a proporção aqui junto.**

## Leads — lixeira, situação e cronômetro

- Excluir no quadro é **soft delete** (`deletedAt`): vai para a aba **Lixeira** e pode ser
  restaurado por 30 dias (`TRASH_RETENTION_DAYS`, espelhado no front). O expurgo roda nas queries de
  listagem (`purgeExpiredTrash`, throttle de 1h) — não há agendador na aplicação.
- `delete`/`restore` são `leadsProcedure` (admin e user); `purge`/`purgeAll` são `adminProcedure`.
- A **situação** de um contato (`responseState`) é **derivada**, nunca gravada: `respondido` pelo
  status, `em atraso` após `RESPONSE_SLA_DAYS` (5) dias sem resposta, senão `a responder`. Gravar
  isso deixaria o valor velho sozinho com o passar dos dias.
- `respondedAt` é carimbado ao entrar em "respondido" e limpo ao sair.
