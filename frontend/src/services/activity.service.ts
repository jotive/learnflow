import type { Activity, ActivityListResponse, ActivityStatus, Priority } from '../models'
import { apiClient } from './api.client'

interface ActivityCreateInput {
  title: string
  description?: string
  priority?: Priority
  is_mandatory?: boolean
  position?: number
}

interface ActivityUpdateInput {
  title?: string
  description?: string
  priority?: Priority
  is_mandatory?: boolean
  position?: number
}

export const activityService = {
  create: async (pathId: string, data: ActivityCreateInput): Promise<Activity> => {
    return apiClient.post<Activity>(`/paths/${pathId}/activities`, data)
  },

  list: async (
    pathId: string,
    filters?: { status?: string; priority?: string }
  ): Promise<ActivityListResponse> => {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.priority) params.append('priority', filters.priority)
    const queryString = params.toString() ? `?${params.toString()}` : ''
    return apiClient.get<ActivityListResponse>(`/paths/${pathId}/activities${queryString}`)
  },

  update: async (id: string, data: ActivityUpdateInput): Promise<Activity> => {
    return apiClient.patch<Activity>(`/activities/${id}`, data)
  },

  updateStatus: async (id: string, status: ActivityStatus): Promise<Activity> => {
    return apiClient.patch<Activity>(`/activities/${id}/status`, { status })
  },

  assign: async (id: string, userId: string | null): Promise<Activity> => {
    return apiClient.post<Activity>(`/activities/${id}/assign`, { user_id: userId })
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<void>(`/activities/${id}`)
  },
}
