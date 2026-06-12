import { handleApiError } from './error.handler'

const BASE_URL = '/api/v1'

const getAuthToken = (): string | null => {
  try {
    const stored = localStorage.getItem('auth-session')
    if (stored) {
      const parsed = JSON.parse(stored)
      return parsed.token || null
    }
  } catch {
    return null
  }
  return null
}

export const apiClient = {
  request: async <T = unknown>(path: string, options: RequestInit = {}): Promise<T> => {
    const token = getAuthToken()
    const headers = new Headers(options.headers)

    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    if (!(options.body instanceof FormData) && !headers.has('Content-Type') && options.body) {
      headers.set('Content-Type', 'application/json')
    }

    const method = options.method || 'GET'
    let urlString = `${BASE_URL}${path}`
    if (method === 'GET') {
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      headers.set('Pragma', 'no-cache')
      headers.set('Expires', '0')
      const connector = path.includes('?') ? '&' : '?'
      urlString = `${BASE_URL}${path}${connector}_t=${Date.now()}`
    }

    try {
      const response = await fetch(urlString, {
        ...options,
        headers,
      })

      if (!response.ok) {
        return await handleApiError(response)
      }

      if (response.status === 204) {
        return null as T
      }

      return (await response.json()) as T
    } catch (err) {
      if (err instanceof TypeError) {
        return await handleApiError(err)
      }
      throw err
    }
  },

  get: <T = unknown>(path: string, options?: RequestInit) =>
    apiClient.request<T>(path, { ...options, method: 'GET' }),

  post: <T = unknown>(path: string, body?: unknown, options?: RequestInit) =>
    apiClient.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = unknown>(path: string, body?: unknown, options?: RequestInit) =>
    apiClient.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T = unknown>(path: string, options?: RequestInit) =>
    apiClient.request<T>(path, { ...options, method: 'DELETE' }),
}
