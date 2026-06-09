# Eagle Center Fitness — Frontend (CLAUDE.md)

Site público + painel admin (React 18 + Vite + Tailwind v4 + tRPC react-query).

API vive em repo separado (`eagle-back`). Os tipos do tRPC vêm de um **git submodule** em `shared/eagle-back/` apontando para esse repo.

## Setup

```bash
git clone <url-deste-repo> eagle-front
cd eagle-front
git submodule update --init --recursive
pnpm install
pnpm dev          # Vite dev server (porta 5173)
```

Backend deve estar rodando (em dev: `http://localhost:3001`). Configurar via `.env`:

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

Gating: `AdminAuthProvider` expõe `role`; `AdminDashboard` filtra `allowedSections`; `AdminUsersProvider.list.useQuery` tem `enabled: role === 'admin'` pra evitar 403.

## Padrões importantes

- Não amend commits — sempre commit novo.
- Não usar `git add -A` — adicione arquivos por nome.
- Não commitar `.env`.
- Optimistic updates: sempre que mutation altera lista visível, use `useUtils().<router>.<query>.setData()` em `onMutate` + rollback em `onError` + `invalidate` em `onSettled`.
- tRPC `onMutate` typing quirk (v11): `variables` aparece como `void | Partial<Input>`. Workaround: cast com `as { ... }` dentro da callback.

## Uploads

Componente reutilizável `src/components/admin/ImageUploader.tsx`. NÃO mostra URL pro usuário — só preview + botão trocar. Upload automático ao escolher arquivo, vai pro endpoint `POST /api/upload` do back.

## RichTextEditor

Tiptap com `StarterKit` + `TextAlign` + `TextStyle` + `FontFamily` + `Underline`. Font picker custom renderiza opções na própria fonte. Adicionar fonte = editar `FONT_OPTIONS` em `components/admin/RichTextEditor.tsx`.
