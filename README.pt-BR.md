# UnTelemetry API

[English version](README.md)

API da UnTelemetry, uma plataforma de observabilidade baseada em OpenTelemetry para centralizar traces HTTP, queries e logs em um dashboard.

O projeto recebe dados no formato OTLP, armazena eventos analiticos no ClickHouse e usa PostgreSQL para entidades da aplicacao, como usuarios, empresas e projetos.

## Frontend

Este repositorio contem apenas a API backend. Para usar a interface completa da UnTelemetry, rode tambem o projeto frontend.

Repositorio do frontend:

```text
https://github.com/Militao36/telemetry-front
```

Ao rodar os dois projetos localmente, configure o `NEXT_PUBLIC_API_URL` do frontend apontando para esta API:

```env
NEXT_PUBLIC_API_URL=http://localhost:3333/api/v1
```

## Versao Hospedada

Se voce nao quiser rodar uma instancia self-hosted, pode usar a plataforma hospedada da UnTelemetry:

```text
https://untelemetry.unledu.com.br/
```

## Recursos

- Ingestao de traces OpenTelemetry via HTTP.
- Ingestao e consulta de logs.
- Dashboards para requisicoes HTTP, queries e erros.
- Busca por traces, spans, logs e metadados.
- Autenticacao JWT para usuarios.
- Token por projeto para envio de telemetria.
- Redacao de campos sensiveis configuravel por projeto.

## Tecnologias

- Node.js
- TypeScript
- Express
- PostgreSQL
- ClickHouse
- Redis
- Bull
- Knex

## Requisitos

- Node.js 20 ou superior
- npm
- PostgreSQL
- Redis
- ClickHouse

## Configuracao

Copie o arquivo de exemplo e ajuste os valores conforme seu ambiente:

```bash
cp .env.sample .env
```

Variaveis principais:

```env
PORT=3333
SECRET_JWT=change-this-secret-before-production

PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=password
PG_DATABASE=telemetry

REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

CLICKHOUSE_URL=http://localhost:8123
CLICKHOUSE_DATABASE=telemetry
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=
```

Para producao, troque obrigatoriamente `SECRET_JWT`, senhas de banco e tokens de integracoes externas.

## Rodando Localmente

Instale as dependencias:

```bash
npm install
```

Execute as migrations do PostgreSQL:

```bash
npx knex migrate:latest --knexfile knexfile.ts
```

Suba a API em modo desenvolvimento:

```bash
npm run dev
```

A API ficara disponivel em:

```text
http://localhost:3333
```

Health check:

```bash
curl http://localhost:3333/health
```

## Rodando com Docker

O `docker-compose.yml` sobe a API, PostgreSQL, Redis e ClickHouse:

```bash
docker compose up --build
```

Depois que os containers estiverem de pe, rode as migrations do PostgreSQL dentro do container da aplicacao:

```bash
docker compose exec app npx knex migrate:latest --knexfile knexfile.ts
```

Ferramentas opcionais:

```bash
docker compose --profile tools up
```

- PgAdmin: `http://localhost:8080`
- Redis Commander: `http://localhost:8081`

## Endpoints Principais

Base URL local:

```text
http://localhost:3333/api/v1
```

Endpoints publicos:

- `POST /users` cria usuario.
- `POST /users/auth` autentica usuario.
- `POST /users/reset-password` solicita reset de senha.

Endpoints autenticados com JWT:

- `GET /users/me` retorna usuario atual.
- `GET /projects` lista projetos.
- `POST /projects` cria projeto.
- `GET /dashboard` retorna metricas gerais.
- `GET /requests/*` consulta metricas de requisicoes HTTP.
- `GET /queries/*` consulta metricas de queries.
- `GET /logs` consulta logs.
- `GET /search` busca dados de telemetria.

Endpoints de ingestao autenticados com token do projeto:

- `POST /traces` recebe payload OTLP de traces.
- `POST /logs` recebe logs.

Exemplos de requisicoes estao na pasta `http/`. Eles usam variaveis como `{{authToken}}` e `{{projectToken}}`; substitua pelos tokens gerados no seu ambiente.

## Build

Gere a versao compilada:

```bash
npm run build
```

Inicie a versao compilada:

```bash
npm start
```

## Qualidade

Execute o lint:

```bash
npm run lint
```

Formate o projeto:

```bash
npm run format
```

## Observacoes de Seguranca

- Nunca versione `.env` com credenciais reais.
- Gere um `SECRET_JWT` forte antes de expor a API.
- Rotacione qualquer token que tenha sido usado em arquivos de exemplo antes de abrir o repositorio.
- Revise payloads OTLP de exemplo, pois traces podem conter IPs, URLs internas, headers e outros dados sensiveis.
- Configure `redactionFields` nos projetos para mascarar campos como `authorization`, `token`, `password`, `secret` e `api_key`.

## Licenca

MIT
