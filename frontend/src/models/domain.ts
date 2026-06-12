export type RoleCode = 'LEADER' | 'MEMBER'
export type Priority = 'HIGH' | 'MEDIUM' | 'LOW'
export type ActivityStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'

export interface Role {
  id: string
  code: RoleCode
  name: string
}

export interface User {
  id: string
  email: string
  name: string
  role: Role
  is_active: boolean
  created_at: string
}

export interface Activity {
  id: string
  path_id: string
  title: string
  description: string | null
  priority: Priority
  is_mandatory: boolean
  status: ActivityStatus
  assigned_to: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface LearningPath {
  id: string
  title: string
  description: string | null
  created_by: string
  completed_at: string | null
  created_at: string
  activity_count: number
  progress_percentage: number
  is_compliant: boolean
  activities?: Activity[]
}

export interface ActivityListResponse {
  activities: Activity[]
  progress_percentage: number
}
