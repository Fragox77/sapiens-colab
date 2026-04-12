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
}

// ─── Admin ────────────────────────────────────────────────────
export const adminApi = {
  dashboard:  () => api.get<unknown>('/api/admin/dashboard'),
  assign:     (id: string, designerId: string) =>
    api.patch<import('@/types').Project>(`/api/admin/projects/${id}/assign`, { designerId }),
  complete:   (id: string) =>
    api.patch<import('@/types').Project>(`/api/admin/projects/${id}/complete`, {}),
  designers:  () => api.get<import('@/types').User[]>('/api/admin/designers'),
  applications: () => api.get<import('@/types').Application[]>('/api/admin/applications'),
  evaluate:   (id: string, data: unknown) =>
    api.patch<import('@/types').Application>(`/api/admin/applications/${id}/evaluate`, data),
}

// ─── Servicios ────────────────────────────────────────────────
export const servicesApi = {
  list:  () => api.get<unknown[]>('/api/services'),
  quote: (data: { serviceType: string; complexity: string; urgency: string }) =>
    api.post<import('@/types').QuoteResult>('/api/services/quote', data),
}
