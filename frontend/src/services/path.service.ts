import type { LearningPath, PageResponse } from '../models'
import { apiClient } from './api.client'

export const pathService = {
  list: async (limit = 100, offset = 0): Promise<LearningPath[]> => {
    const response = await apiClient.get<PageResponse<LearningPath>>(`/paths?limit=${limit}&offset=${offset}`)
    return response.items
  },

  get: async (id: string): Promise<LearningPath> => {
    return apiClient.get<LearningPath>(`/paths/${id}`)
  },

  create: async (title: string, description?: string): Promise<LearningPath> => {
    return apiClient.post<LearningPath>('/paths', { title, description })
  },

  update: async (id: string, title?: string, description?: string): Promise<LearningPath> => {
    return apiClient.patch<LearningPath>(`/paths/${id}`, { title, description })
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete<void>(`/paths/${id}`)
  },

  complete: async (id: string): Promise<LearningPath> => {
    return apiClient.post<LearningPath>(`/paths/${id}/complete`)
  },
}
