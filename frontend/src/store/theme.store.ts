import { create } from 'zustand'

export type Theme = 'light' | 'dark'

interface ThemeState {
  theme: Theme
  toggleTheme: () => void
  initializeTheme: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'dark', // Por defecto modo oscuro premium de Crehana
  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark'
    set({ theme: nextTheme })
    
    const root = document.documentElement
    if (nextTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('theme', nextTheme)
  },
  initializeTheme: () => {
    const saved = localStorage.getItem('theme') as Theme | null
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme = saved || (systemPrefersDark ? 'dark' : 'light')
    
    set({ theme: initialTheme })
    const root = document.documentElement
    if (initialTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }
}))
