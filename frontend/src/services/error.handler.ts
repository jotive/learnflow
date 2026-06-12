import { ApiError } from '../models'
import { useToastStore } from '../store/toast.store'

// Cargado de forma dinámica para evitar importación circular con el store de autenticación
type AuthStoreModule = typeof import('../store/auth.store')
let authStoreInstance: AuthStoreModule['useAuthStore'] | null = null
const getAuthStore = async () => {
  if (!authStoreInstance) {
    const { useAuthStore } = await import('../store/auth.store')
    authStoreInstance = useAuthStore
  }
  return authStoreInstance
}

export const handleApiError = async (errorSource: Response | Error): Promise<never> => {
  if (errorSource instanceof Error) {
    useToastStore.getState().addToast(
      'Error de conexión. Asegúrate de que el backend esté ejecutándose.',
      'error'
    )
    throw new ApiError(errorSource.message || 'Error de conexión', 0, 'network_error')
  }

  let errorMessage = 'Ha ocurrido un error inesperado.'
  let errorCode = 'unknown_error'

  try {
    const body = await errorSource.json()
    if (body && body.message) {
      errorMessage = body.message
      if (body.code) errorCode = body.code
    } else if (body && body.detail) {
      if (Array.isArray(body.detail)) {
        errorMessage = body.detail.map((err: { msg: string }) => err.msg).join('. ')
      } else {
        errorMessage = body.detail
      }
      errorCode = 'validation_error'
    }
  } catch {
    errorMessage = errorSource.statusText || errorMessage
  }

  if (errorSource.status === 401) {
    useToastStore.getState().addToast('Sesión expirada o inválida. Inicia sesión nuevamente.', 'error')
    const authStore = await getAuthStore()
    authStore.getState().logout()
    
    // Redirección si no estamos ya en el login
    if (!window.location.pathname.endsWith('/login')) {
      window.location.href = '/login'
    }
  } else {
    useToastStore.getState().addToast(errorMessage, 'error')
  }

  throw new ApiError(errorMessage, errorSource.status, errorCode)
}
