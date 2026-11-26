const BASE_URL = import.meta.env.VITE_API_URL as string
const TOKEN_KEY = 'mycondo_token'

export const UNAUTHORIZED_EVENT = 'mycondo:unauthorized'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number
  errors: Record<string, string[]>

  constructor(status: number, message: string, errors: Record<string, string[]> = {}) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = tokenStore.get()
  const isForm = options.body instanceof FormData

  const headers: Record<string, string> = { Accept: 'application/json' }
  // For FormData the browser sets the Content-Type itself, including the boundary
  if (options.body !== undefined && !isForm) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

   const response = await fetch(`${BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body:
        options.body === undefined
          ? undefined
          : isForm
            ? (options.body as FormData)
            : JSON.stringify(options.body),
    })

  if (response.status === 204) return undefined as T

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401 && token) {
      tokenStore.clear()
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    throw new ApiError(response.status, data.message ?? 'Something went wrong.', data.errors)
  }

  return data as T
}

export async function apiBlob(path: string): Promise<Blob> {
  const token = tokenStore.get()

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (!response.ok) throw new ApiError(response.status, 'Could not load the file.')
  return response.blob()
}