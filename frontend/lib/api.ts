import Cookies from 'js-cookie'

const BASE_URL = '/api/backend'

export function getToken(): string | null {
  return Cookies.get('token') || null
}

export function setToken(token: string) {
  Cookies.set('token', token, { expires: 30, sameSite: 'strict' })
}

export function removeToken() {
  Cookies.remove('token')
}

export function getProjectId(): string | null {
  return Cookies.get('projectId') || null
}

export function setProjectId(id: string) {
  Cookies.set('projectId', id, { expires: 30, sameSite: 'strict' })
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const projectId = getProjectId()

  const url = new URL(BASE_URL + path, window.location.origin)
  if (projectId) {
    url.searchParams.set('projectId', projectId)
  }

  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (res.status === 401) {
    removeToken()
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(err.error || 'Erro na requisição')
  }

  if (res.status === 204) return {} as T
  return res.json()
}

// Auth
export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: any }>('/users/auth', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<any>('/users/me'),
  },

  projects: {
    list: () => request<any[]>('/projects'),
    create: (data: { name: string; description?: string }) =>
      request<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  },

  dashboard: {
    report: (hour: number = 12) =>
      request<any>(`/dashboard?hour=${hour}`),
  },

  requests: {
    recent: (hour: number = 12, httpMethod?: string) => {
      const params = new URLSearchParams({ hour: String(hour) })
      if (httpMethod && httpMethod !== 'ALL') params.set('httpMethod', httpMethod)
      return request<any[]>(`/requests/recent?${params}`)
    },
    slowest: (hour: number = 12, httpMethod?: string) => {
      const params = new URLSearchParams({ hour: String(hour) })
      if (httpMethod && httpMethod !== 'ALL') params.set('httpMethod', httpMethod)
      return request<any[]>(`/requests/slowest?${params}`)
    },
    metrics: (hour: number = 12, httpMethod?: string) => {
      const params = new URLSearchParams({ hour: String(hour) })
      if (httpMethod && httpMethod !== 'ALL') params.set('httpMethod', httpMethod)
      return request<any>(`/requests/metrics?${params}`)
    },
    traces: (traceId: string) => request<any[]>(`/requests/traces/${traceId}`),
  },

  logs: {
    list: (params?: Record<string, string>) => {
      const qs = params ? '?' + new URLSearchParams(params).toString() : ''
      return request<any[]>(`/logs${qs}`)
    },
  },

  queries: {
    dashboard: (hour: number = 12) => request<any>(`/queries/dashboard?hour=${hour}`),
    list: (hour: number = 720, queryTy?: string) => {
      const params = new URLSearchParams({ hour: String(hour) })
      if (queryTy && queryTy !== 'all') params.set('queryTy', queryTy)
      return request<any>(`/queries?${params}`)
    },
    traces: (traceId: string) => request<any[]>(`/queries/traces/${traceId}`),
  },

  search: {
    list: (params: Record<string, string>) =>
      request<any[]>(`/search?${new URLSearchParams(params)}`),
  },
}
