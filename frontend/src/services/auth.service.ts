import type { PageResponse, TokenResponse, User } from '../models'
import { apiClient } from './api.client'

export const authService = {
  login: async (email: string, password: string): Promise<string> => {
    const response = await apiClient.post<TokenResponse>('/auth/login', { email, password })
    return response.access_token
  },

  getProfile: async (): Promise<User> => {
    return apiClient.get<User>('/users/me')
  },

  provisionMember: async (email: string, name: string, password: string): Promise<User> => {
    return apiClient.post<User>('/users', { email, name, password })
  },

  listMembers: async (limit = 100, offset = 0): Promise<User[]> => {
    const response = await apiClient.get<PageResponse<User>>(`/users?limit=${limit}&offset=${offset}`)
    return response.items
  },

  updateMember: async (id: string, name?: string, email?: string, password?: string): Promise<User> => {
    return apiClient.patch<User>(`/users/${id}`, { name, email, password })
  },

  deleteMember: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`)
  },
}
