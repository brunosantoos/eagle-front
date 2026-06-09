# Build context = eagle-front repository root.
# Type-only import from src/lib/trpc.ts resolves via git submodule at shared/eagle-back.
# Make sure the build context has shared/eagle-back populated:
#   git submodule update --init --recursive

FROM node:20-alpine AS build
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY shared/eagle-back/package.json shared/eagle-back/pnpm-lock.yaml ./shared/eagle-back/
RUN pnpm install --frozen-lockfile

COPY . ./

ARG VITE_API_URL=/trpc
ARG VITE_BACKEND_URL=
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

RUN pnpm run build

FROM nginx:alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/public /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
