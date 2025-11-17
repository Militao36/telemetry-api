# Telemetry API

API de telemetria para monitoramento de aplicações, fornecendo métricas, traces e logs com alta performance usando ClickHouse.

## O que esta API pode fazer?

Esta API fornece funcionalidades completas de observabilidade para suas aplicações:

### 📊 Dashboard de Métricas HTTP
- **Total de requisições** em período configurável
- **Total de erros** (HTTP status >= 500)
- **Tempo médio de resposta**
- **Percentis de performance** (P50, P90, P95, P99)
- **Top 10 requisições** mais frequentes
- **Série temporal** de requisições por hora
- **20 requisições mais lentas**

### 🗄️ Análise de Queries de Banco de Dados
- **Métricas de queries** por tipo (SELECT, INSERT, UPDATE, DELETE)
- **Performance de queries**
- **Top queries** mais executadas
- **Queries mais lentas**

### 🔍 Traces Distribuídos
- **Ingestão de traces** via protocolo OTLP
- **Visualização de traces** completos
- **Análise de spans** individuais

### 📝 Gerenciamento de Logs
- **Ingestão de logs** estruturados
- **Consulta e filtragem** de logs
- **Análise por severidade**

## Endpoints Disponíveis

### Informações da API
```
GET /api/v1/info
```
Retorna informações completas sobre a API e suas capacidades.

```
GET /api/v1/info/capabilities
```
Lista todos os endpoints disponíveis com descrições.

### Dashboard HTTP
```
GET /api/v1/dashboard
```
Retorna métricas do dashboard de requisições HTTP.

**Query Parameters:**
- `hour` (opcional): Filtro de tempo em horas (1, 3, 6, 12, 24). Padrão: 12

**Resposta:**
```json
{
  "totalRequests": 1234,
  "totalErrors": 10,
  "avgResponse": 125.5,
  "p50Ms": 100.2,
  "p90Ms": 250.5,
  "p95Ms": 350.8,
  "p99Ms": 500.1,
  "topRequests": [...],
  "requestPerTimeSeries": [...],
  "slowestRequests": [...],
  "totalQueries": 5678
}
```

### Análise de Queries
```
GET /api/v1/queries
```
Retorna análise de queries de banco de dados.

**Query Parameters:**
- `hour` (opcional): Filtro de tempo em horas. Padrão: 12
- `queryType` (opcional): Tipo de query (select, insert, update, delete, all)

```
GET /api/v1/queries/dashboard
```
Retorna dashboard específico de queries.

### Traces
```
POST /api/v1/trace
```
Endpoint para ingestão de traces (OTLP format).

### Logs
```
POST /api/v1/logs
```
Endpoint para ingestão de logs.

### Health Check
```
GET /health
```
Verifica se a API está funcionando.

## Tecnologias

- **Node.js** + **TypeScript**
- **Express** - Framework web
- **ClickHouse** - Banco de dados analítico de alta performance
- **Redis** + **Bull** - Filas de processamento
- **Awilix** - Injeção de dependências
- **OTLP** - Open Telemetry Protocol

## Como Usar

### Instalação
```bash
yarn install
```

### Desenvolvimento
```bash
yarn dev
```

### Build
```bash
yarn build
```

### Produção
```bash
yarn start
```

### Docker
```bash
docker-compose up
```

## Configuração

Variáveis de ambiente disponíveis:

- `PORT` - Porta do servidor (padrão: 3333)
- `CLICKHOUSE_URL` - URL do ClickHouse
- `CLICKHOUSE_USER` - Usuário do ClickHouse
- `CLICKHOUSE_PASSWORD` - Senha do ClickHouse
- `CLICKHOUSE_DATABASE` - Database do ClickHouse
- `REDIS_HOST` - Host do Redis
- `REDIS_PORT` - Porta do Redis
- `REDIS_PASSWORD` - Senha do Redis
- `LOG_LEVEL` - Nível de log (padrão: info)

## Funcionalidades Planejadas

##### Dashboard (tela inicial)

Filtros:
- Filtro por 1hr/3hr/6hr/12hr/24hr ✅
- Filtro por serviço ⏳

Métricas:
- Requests ✅
- Erros ✅
- Avg Response ✅
- Gráfico com requests por hora (00:00 até 23:59) ✅
- Erros por hora ⏳
- Tempo de resposta por hora ✅
- Top Requests ✅
