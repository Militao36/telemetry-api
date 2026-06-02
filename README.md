# UnTelemetry API

[Portuguese version](README.pt-BR.md)

UnTelemetry API is an observability backend based on OpenTelemetry. It centralizes HTTP traces, database queries, and logs so they can be explored in a dashboard.

The API receives OTLP data, stores analytics events in ClickHouse, and uses PostgreSQL for application entities such as users, companies, and projects.

## Frontend

This repository contains only the backend API. To use the complete UnTelemetry interface, run the frontend project as well.

Frontend repository:

```text
https://github.com/Militao36/telemetry-front
```

When running both projects locally, configure the frontend `NEXT_PUBLIC_API_URL` to point to this API:

```env
NEXT_PUBLIC_API_URL=http://localhost:3333/api/v1
```

## Hosted Version

If you do not want to run a self-hosted instance, you can use the hosted UnTelemetry platform:

```text
https://untelemetry.unledu.com.br/
```

## Features

- OpenTelemetry trace ingestion over HTTP.
- Log ingestion and search.
- Dashboards for HTTP requests, queries, and errors.
- Search across traces, spans, logs, and metadata.
- JWT authentication for users.
- Project token authentication for telemetry ingestion.
- Configurable sensitive-field redaction per project.

## Tech Stack

- Node.js
- TypeScript
- Express
- PostgreSQL
- ClickHouse
- Redis
- Bull
- Knex

## Requirements

- Node.js 20 or higher
- npm
- PostgreSQL
- Redis
- ClickHouse

## Configuration

Copy the example environment file and adjust the values for your environment:

```bash
cp .env.sample .env
```

Main environment variables:

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

For production, always replace `SECRET_JWT`, database passwords, and external integration tokens.

## Running Locally

Install dependencies:

```bash
npm install
```

Run PostgreSQL migrations:

```bash
npx knex migrate:latest --knexfile knexfile.ts
```

Start the API in development mode:

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:3333
```

Health check:

```bash
curl http://localhost:3333/health
```

## Running With Docker

The `docker-compose.yml` file starts the API, PostgreSQL, Redis, and ClickHouse:

```bash
docker compose up --build
```

After the containers are running, execute PostgreSQL migrations inside the application container:

```bash
docker compose exec app npx knex migrate:latest --knexfile knexfile.ts
```

Optional tools:

```bash
docker compose --profile tools up
```

- PgAdmin: `http://localhost:8080`
- Redis Commander: `http://localhost:8081`

## Main Endpoints

Local base URL:

```text
http://localhost:3333/api/v1
```

Public endpoints:

- `POST /users` creates a user.
- `POST /users/auth` authenticates a user.
- `POST /users/reset-password` requests a password reset.

JWT-authenticated endpoints:

- `GET /users/me` returns the current user.
- `GET /projects` lists projects.
- `POST /projects` creates a project.
- `GET /dashboard` returns general metrics.
- `GET /requests/*` returns HTTP request metrics.
- `GET /queries/*` returns query metrics.
- `GET /logs` searches logs.
- `GET /search` searches telemetry data.

Project-token-authenticated ingestion endpoints:

- `POST /traces` receives OTLP trace payloads.
- `POST /logs` receives logs.

Request examples are available in the `http/` directory. They use variables such as `{{authToken}}` and `{{projectToken}}`; replace them with tokens generated in your environment.

## Build

Build the project:

```bash
npm run build
```

Start the compiled version:

```bash
npm start
```

## Quality

Run lint checks:

```bash
npm run lint
```

Format the project:

```bash
npm run format
```

## Security Notes

- Never commit `.env` files with real credentials.
- Generate a strong `SECRET_JWT` before exposing the API.
- Rotate any token that may have been used in example files before publishing the repository.
- Review OTLP example payloads because traces may contain IPs, internal URLs, headers, and other sensitive data.
- Configure `redactionFields` in projects to mask fields such as `authorization`, `token`, `password`, `secret`, and `api_key`.

## License

MIT
