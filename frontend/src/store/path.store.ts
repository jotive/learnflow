import { create } from 'zustand'
import type { Activity, ActivityStatus, LearningPath, Priority, User } from '../models'
import { pathService } from '../services/path.service'
import { activityService } from '../services/activity.service'
import { authService } from '../services/auth.service'
import { useToastStore } from './toast.store'

export type { Activity, LearningPath }

interface PathState {
  paths: LearningPath[]
  currentPath: LearningPath | null
  activities: Activity[]
  progressPercentage: number
  members: User[]
  isLoading: boolean

  fetchPaths: () => Promise<void>
  fetchPathDetails: (id: string) => Promise<void>
  fetchActivities: (pathId: string, filters?: { status?: string; priority?: string }) => Promise<void>
  fetchMembers: () => Promise<void>

  createPath: (title: string, description?: string) => Promise<boolean>
  deletePath: (id: string) => Promise<boolean>
  signOffPath: (id: string) => Promise<boolean>

  createActivity: (pathId: string, data: {
    title: string
    description?: string
    priority?: Priority
    is_mandatory?: boolean
    position?: number
  }) => Promise<boolean>
  updateActivityStatus: (id: string, pathId: string, status: ActivityStatus) => Promise<boolean>
  assignActivity: (id: string, pathId: string, userId: string | null) => Promise<boolean>
  deleteActivity: (id: string, pathId: string) => Promise<boolean>
  updateMember: (id: string, name?: string, email?: string, password?: string) => Promise<boolean>
  deleteMember: (id: string) => Promise<boolean>
}

export const usePathStore = create<PathState>((set, get) => ({
  paths: [],
  currentPath: null,
  activities: [],
  progressPercentage: 0,
  members: [],
  isLoading: false,

  fetchPaths: async () => {
    set({ isLoading: true })
    try {
      const paths = await pathService.list()
      set({ paths, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchPathDetails: async (id) => {
    set({ isLoading: true })
    try {
      const currentPath = await pathService.get(id)
      set({ currentPath, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchActivities: async (pathId, filters) => {
    set({ isLoading: true })
    try {
      const response = await activityService.list(pathId, filters)
      set({ 
        activities: response.activities, 
        progressPercentage: response.progress_percentage,
        isLoading: false 
      })
    } catch {
      set({ isLoading: false })
    }
  },

  fetchMembers: async () => {
    try {
      const members = await authService.listMembers()
      set({ members })
    } catch {
      // Ignorar fallo de carga de miembros para usuarios sin permisos (miembros estándar)
    }
  },

  createPath: async (title, description) => {
    set({ isLoading: true })
    try {
      await pathService.create(title, description)
      useToastStore.getState().addToast('Ruta de aprendizaje creada con éxito.', 'success')
      await get().fetchPaths()
      return true
    } catch {
      set({ isLoading: false })
      return false
    }
  },

  deletePath: async (id) => {
    set({ isLoading: true })
    try {
      await pathService.delete(id)
      useToastStore.getState().addToast('Ruta de aprendizaje eliminada.', 'info')
      await get().fetchPaths()
      return true
    } catch {
      set({ isLoading: false })
      return false
    }
  },

  signOffPath: async (id) => {
    set({ isLoading: true })
    try {
      await pathService.complete(id)
      useToastStore.getState().addToast('¡Ruta completada y firmada con éxito!', 'success')
      await get().fetchPathDetails(id)
      await get().fetchPaths()
      return true
    } catch {
      set({ isLoading: false })
      return false
    }
  },

  createActivity: async (pathId, data) => {
    try {
      await activityService.create(pathId, data)
      useToastStore.getState().addToast('Actividad agregada con éxito.', 'success')
      await get().fetchPathDetails(pathId)
      await get().fetchActivities(pathId)
      return true
    } catch {
      return false
    }
  },

  updateActivityStatus: async (id, pathId, status) => {
    try {
      await activityService.updateStatus(id, status)
      useToastStore.getState().addToast('Estado de actividad actualizado.', 'success')
      await get().fetchPathDetails(pathId)
      await get().fetchActivities(pathId)
      return true
    } catch {
      return false
    }
  },

  assignActivity: async (id, pathId, userId) => {
    try {
      await activityService.assign(id, userId)
      const memberName = userId ? (get().members.find(m => m.id === userId)?.name || 'miembro') : 'Sin asignar'
      useToastStore.getState().addToast(
        userId
          ? `Actividad asignada a ${memberName} con éxito. Invitación de email simulada registrada en el backend.`
          : 'Asignación de miembro removida de la actividad.',
        'success'
      )
      await get().fetchPathDetails(pathId)
      await get().fetchActivities(pathId)
      return true
    } catch {
      return false
    }
  },

  deleteActivity: async (id, pathId) => {
    try {
      await activityService.delete(id)
      useToastStore.getState().addToast('Actividad eliminada.', 'info')
      await get().fetchPathDetails(pathId)
      await get().fetchActivities(pathId)
      return true
    } catch {
      return false
    }
  },

  updateMember: async (id, name, email, password) => {
    try {
      await authService.updateMember(id, name, email, password)
      useToastStore.getState().addToast('Información de miembro actualizada con éxito.', 'success')
      await get().fetchMembers()
      return true
    } catch {
      return false
    }
  },

  deleteMember: async (id) => {
    try {
      await authService.deleteMember(id)
      useToastStore.getState().addToast('Miembro desactivado con éxito.', 'info')
      await get().fetchMembers()
      return true
    } catch {
      return false
    }
  }
}))
