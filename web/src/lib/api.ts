// ─── SAPIENS COLAB — API client ────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('sc_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`)
  return data as T
}

export const api = {
  get:    <T>(path: string) => request<T>(path),
  post:   <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch:  <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}

// ─── Auth ─────────────────────────────────────────────────────
export const authApi = {
  login:    (email: string, password: string) =>
    api.post<{ token: string; user: import('@/types').User }>('/api/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; company?: string; phone?: string }) =>
    api.post<{ token: string; user: import('@/types').User }>('/api/auth/registro', data),
  me:       () => api.get<import('@/types').User>('/api/auth/me'),
}

// ─── Proyectos ────────────────────────────────────────────────
export const projectsApi = {
  list:    () => api.get<import('@/types').Project[]>('/api/projects'),
  get:     (id: string) => api.get<import('@/types').Project>(`/api/projects/${id}`),
  create:  (data: unknown) => api.post<import('@/types').Project>('/api/projects', data),
  deliver: (id: string, body: { fileUrl: string; fileName: string }) =>
    api.patch<import('@/types').Project>(`/api/projects/${id}/deliver`, body),
  review:  (id: string, body: { action: 'approve' | 'request-revision'; message?: string }) =>
    api.patch<import('@/types').Project>(`/api/projects/${id}/review`, body),
  feedback: (id: string, body: { rating: number; nps?: number; comment?: string }) =>
    api.post<{ rating: number; nps?: number; comment?: string }>(`/api/projects/${id}/feedback`, body),
}

// ─── Admin ────────────────────────────────────────────────────
export const adminApi = {
  assign:     (id: string, designerId: string) =>
    api.patch<import('@/types').Project>(`/api/admin/projects/${id}/assign`, { designerId }),
  complete:   (id: string) =>
    api.patch<import('@/types').Project>(`/api/admin/projects/${id}/complete`, {}),
  designers:  () => api.get<import('@/types').User[]>('/api/admin/designers'),
  applications: () => api.get<import('@/types').Application[]>('/api/admin/applications'),
  application: (id: string) => api.get<import('@/types').Application>(`/api/admin/applications/${id}`),
  evaluate:   (id: string, data: unknown) =>
    api.patch<import('@/types').Application>(`/api/admin/applications/${id}/evaluate`, data),
  brief:      (id: string, brief: string) =>
    api.patch<import('@/types').Application>(`/api/admin/applications/${id}/brief`, { brief }),
  activate:   (id: string) =>
    api.patch<{ application: import('@/types').Application; user: import('@/types').User; tempPassword: string }>(`/api/admin/applications/${id}/activate`, {}),
  reject:     (id: string, notes?: string) =>
    api.patch<import('@/types').Application>(`/api/admin/applications/${id}/reject`, { notes }),
  financiero:  () => api.get<import('@/types').FinancieroReport>('/api/admin/financiero'),
  anticipo:    (id: string) =>
    api.patch<import('@/types').Project>(`/api/admin/projects/${id}/anticipo`, {}),
}

export const quotesApi = {
  create: (data: {
    client: { name: string; email: string; company?: string }
    serviceType: string
    complexity: string
    urgency: string
  }) => api.post<import('@/types').QuoteCreationResponse>('/api/quotes', data),
  list: () => api.get<{ success: boolean; data: import('@/types').Quote[] }>('/api/quotes'),
  get: (id: string) => api.get<{ success: boolean; data: import('@/types').Quote }>(`/api/quotes/${id}`),
  calculateV1: (data: {
    serviceType: string
    complexity: string
    urgency: string
    lead?: { name?: string; email?: string; company?: string }
  }) => api.post<import('@/types').QuoteResult & { quoteRequestId: string; leadCaptured: boolean }>('/api/v1/quotes/calculate', data),
  catalogV1: () => api.get<{
    services: Array<{ id: string; name: string; base: number; tag: string }>
    complexities: string[]
    urgencies: string[]
  }>('/api/v1/quotes/catalog'),
}

export const billingApi = {
  plans: () => api.get<{ items: Array<{ plan: string; monthlyFee: number; commissionRate: number; seats: number; maxActiveProjects: number }> }>('/api/v1/billing/plans'),
  overview: () => api.get<{ tenantId: string; plan: string; commissionRate: number; seats: number; maxActiveProjects: number; monthlyFee: number; model: string }>('/api/v1/billing/overview'),
  preview: (data: { plan: string; monthlyProjects: number; avgTicket: number }) =>
    api.post<{ plan: string; monthlyFee: number; commissionRate: number; commissionRevenue: number; projectedMRR: number }>('/api/v1/billing/preview', data),
  changePlan: (plan: 'basic' | 'pro' | 'enterprise') =>
    api.patch<{ tenantId: string; plan: string; commissionRate: number; seats: number; maxActiveProjects: number }>('/api/v1/billing/plan', { plan }),
}

function buildQuery(params?: { from?: string; to?: string }) {
  if (!params) return ''
  const entries = Object.entries(params).filter(([, v]) => Boolean(v))
  if (entries.length === 0) return ''
  return `?${new URLSearchParams(entries as [string, string][]).toString()}`
}

export const metricsApi = {
  dashboard: (params?: { from?: string; to?: string }) => {
    return api.get<import('@/types').DashboardMetrics>(`/api/metrics/dashboard${buildQuery(params)}`)
  },
  performance: (params?: { from?: string; to?: string }) => {
    return api.get<import('@/types').PerformanceMetrics>(`/api/metrics/performance${buildQuery(params)}`)
  },
  finance: (params?: { from?: string; to?: string }) => {
    return api.get<import('@/types').FinanceMetrics>(`/api/metrics/finance${buildQuery(params)}`)
  },
}
