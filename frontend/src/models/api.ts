export interface PageResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(message: string, status: number, code = 'unknown_error') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: ApiError }
