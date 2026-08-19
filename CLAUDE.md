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
- Sliders de config: componente `SliderField` (topo de `AdminDashboard.tsx`); cores: `ColorField` (valor `''` = padrão do site).
- Rodapé: contato com campo vazio simplesmente não aparece — é assim que se oculta telefone/e-mail/endereço/rede social.
- Carrossel da Home é configurável em `content.home.carousel` (cores, tamanho de fonte dos cards, véu branco e degradê lateral).

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

**Regra:** o conteúdo grava sempre o caminho **relativo** (`/uploads/<arquivo>`). O host do backend entra
só no render, com `resolveMediaUrl()` de `src/lib/mediaUrl.ts`. Todo `<img>`/`<video>` que exibe mídia do
`SiteContent` passa por ela — inclusive previews do admin. Gravar URL absoluta quebra o site quando o
domínio muda (era a causa do bug "mídias não replicam").

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
guias de terços, prévia com máscara. Gera WebP (fallback JPEG) com no máximo 1920px de largura e sobe
como arquivo novo. Disponível em qualquer `ImageUploader` (Home/carrossel/hero) e na aba Mídias
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

## RichTextEditor

Tiptap com `StarterKit` + `TextAlign` + `TextStyle` + `FontFamily` + `Underline`. Font picker custom renderiza opções na própria fonte. Adicionar fonte = editar `FONT_OPTIONS` em `components/admin/RichTextEditor.tsx`.
