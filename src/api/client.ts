const BASE_URL = 'paxeer-dev-portal.railway.internal'

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>
}

export async function api<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options

  let url = `${BASE_URL}${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        searchParams.set(key, String(value))
      }
    }
    const qs = searchParams.toString()
    if (qs) url += `?${qs}`
  }

  const res = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const msg = body?.message ? `${body.error}: ${body.message}` : body?.error
    throw new Error(msg || `API error: ${res.status}`)
  }

  return res.json()
}

export function apiGet<T>(endpoint: string, params?: Record<string, string | number | undefined>): Promise<T> {
  return api<T>(endpoint, { params })
}

export function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
  return api<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
