import { GET, route } from "awilix-express"
import { Request, Response } from "express";

@route('/info')
export class InfoController {
  @GET()
  async getApiInfo(request: Request, response: Response) {
    const apiInfo = {
      name: "Telemetry API",
      version: "1.0.0",
      description: "API de telemetria para monitoramento de aplicações, fornecendo métricas, traces e logs",
      capabilities: {
        dashboard: {
          description: "Dashboard com métricas e análises de requisições HTTP",
          endpoint: "/api/v1/dashboard",
          features: [
            "Total de requisições",
            "Total de erros (HTTP status >= 500)",
            "Tempo médio de resposta",
            "Percentis de performance (P50, P90, P95, P99)",
            "Top 10 requisições mais frequentes",
            "Série temporal de requisições por hora",
            "20 requisições mais lentas",
            "Total de queries no banco de dados"
          ],
          filters: {
            hour: "Filtro de tempo em horas (1, 3, 6, 12, 24)"
          }
        },
        queries: {
          description: "Análise de queries de banco de dados",
          endpoints: {
            list: "/api/v1/queries",
            dashboard: "/api/v1/queries/dashboard"
          },
          features: [
            "Análise de queries por tipo (select, insert, update, delete)",
            "Métricas de performance de queries",
            "Top queries mais executadas",
            "Queries mais lentas"
          ],
          filters: {
            hour: "Filtro de tempo em horas",
            queryType: "Tipo de query (select, insert, update, delete, all)"
          }
        },
        traces: {
          description: "Gerenciamento e visualização de traces distribuídos",
          endpoint: "/api/v1/trace",
          features: [
            "Ingestão de traces via OTLP",
            "Visualização de traces",
            "Análise de spans"
          ]
        },
        logs: {
          description: "Gerenciamento e análise de logs",
          endpoint: "/api/v1/logs",
          features: [
            "Ingestão de logs",
            "Consulta e filtragem de logs",
            "Análise de logs por severidade"
          ]
        }
      },
      dataRetention: {
        description: "Os dados são armazenados em ClickHouse para análise de alta performance"
      },
      healthCheck: {
        endpoint: "/health",
        description: "Endpoint para verificar se a API está funcionando"
      }
    };

    return response.status(200).json(apiInfo);
  }

  @route('/capabilities')
  @GET()
  async getCapabilities(request: Request, response: Response) {
    const capabilities = {
      endpoints: [
        {
          path: "/api/v1/dashboard",
          method: "GET",
          description: "Retorna métricas do dashboard de requisições HTTP",
          queryParams: {
            hour: "opcional - tempo de filtro em horas (padrão: 12)"
          }
        },
        {
          path: "/api/v1/queries",
          method: "GET",
          description: "Retorna análise de queries de banco de dados",
          queryParams: {
            hour: "opcional - tempo de filtro em horas (padrão: 12)",
            queryType: "opcional - tipo de query (select, insert, update, delete, all)"
          }
        },
        {
          path: "/api/v1/queries/dashboard",
          method: "GET",
          description: "Retorna dashboard de queries"
        },
        {
          path: "/api/v1/trace",
          method: "POST",
          description: "Recebe traces para processamento"
        },
        {
          path: "/api/v1/logs",
          method: "POST",
          description: "Recebe logs para processamento"
        },
        {
          path: "/health",
          method: "GET",
          description: "Health check endpoint"
        },
        {
          path: "/api/v1/info",
          method: "GET",
          description: "Retorna informações detalhadas sobre a API"
        },
        {
          path: "/api/v1/info/capabilities",
          method: "GET",
          description: "Retorna lista de endpoints disponíveis"
        }
      ],
      metrics: {
        http: [
          "Total de requisições",
          "Total de erros",
          "Tempo médio de resposta",
          "Percentis (P50, P90, P95, P99)",
          "Top requests",
          "Série temporal",
          "Slowest requests"
        ],
        database: [
          "Total de queries",
          "Queries por tipo",
          "Performance de queries",
          "Slow queries"
        ]
      },
      integrations: {
        storage: "ClickHouse",
        queue: "Bull/Redis",
        protocols: ["OTLP", "HTTP JSON"]
      }
    };

    return response.status(200).json(capabilities);
  }
}
