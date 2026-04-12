import { User } from '@/types'

const TOKEN_KEY = 'sc_token'
const USER_KEY  = 'sc_user'

export function saveSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getStoredUser(): User | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(USER_KEY)
  try { return raw ? JSON.parse(raw) : null } catch { return null }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

/** Dashboard route según rol */
export function dashboardPath(role: User['role']): string {
  if (role === 'admin')    return '/admin'
  if (role === 'disenador') return '/disenador'
  return '/cliente'
}
