import { create } from 'zustand'
import type { RoleCode, User } from '../models'
import { authService } from '../services/auth.service'
import { useToastStore } from './toast.store'

export type { User }

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  provisionMember: (email: string, name: string, password: string) => Promise<User | null>
  initialize: () => Promise<void>
}

const getSavedSession = () => {
  try {
    const saved = localStorage.getItem('auth-session')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.token && parsed.user) {
        return { token: parsed.token, user: parsed.user, isAuthenticated: true }
      }
    }
  } catch {
    return { token: null, user: null, isAuthenticated: false }
  }
  return { token: null, user: null, isAuthenticated: false }
}

const initialSession = getSavedSession()

export const useAuthStore = create<AuthState>((set, get) => ({
  token: initialSession.token,
  user: initialSession.user,
  isAuthenticated: initialSession.isAuthenticated,
  isLoading: false,

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const token = await authService.login(email, password)
      
      // Guardar token temporalmente para que getProfile lo inyecte
      localStorage.setItem('auth-session', JSON.stringify({ token, user: null }))
      
      const user = await authService.getProfile()
      
      set({
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      })
      
      localStorage.setItem('auth-session', JSON.stringify({ token, user }))
      useToastStore.getState().addToast(`¡Bienvenido de nuevo, ${user.name}!`, 'success')
      return true
    } catch {
      set({ token: null, user: null, isAuthenticated: false, isLoading: false })
      localStorage.removeItem('auth-session')
      return false
    }
  },

  logout: () => {
    set({ token: null, user: null, isAuthenticated: false })
    localStorage.removeItem('auth-session')
    useToastStore.getState().addToast('Sesión cerrada correctamente.', 'info')
  },

  provisionMember: async (email, name, password) => {
    try {
      const member = await authService.provisionMember(email, name, password)
      useToastStore.getState().addToast(
        `Miembro ${name} registrado con éxito. Invitación de email simulada registrada en el backend.`,
        'success'
      )
      return member
    } catch {
      return null
    }
  },

  initialize: async () => {
    const session = getSavedSession()
    if (session.token) {
      set({ isLoading: true })
      try {
        const user = await authService.getProfile()
        set({ token: session.token, user, isAuthenticated: true, isLoading: false })
        localStorage.setItem('auth-session', JSON.stringify({ token: session.token, user }))
      } catch {
        get().logout()
        set({ isLoading: false })
      }
    }
  },
}))

export const useUserRole = (): RoleCode | null =>
  useAuthStore((state) => state.user?.role.code ?? null)

export const useHasRole = (role: RoleCode): boolean =>
  useAuthStore((state) => state.user?.role.code === role)

export const useIsLeader = (): boolean => useHasRole('LEADER')
