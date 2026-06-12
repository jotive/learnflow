import React from 'react'
import { Navigate } from 'react-router-dom'
import type { RoleCode } from '../models'
import { useAuthStore } from '../store/auth.store'

interface RoleRouteProps {
  allow: RoleCode[]
  children: React.ReactNode
  redirectTo?: string
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allow, children, redirectTo = '/' }) => {
  const role = useAuthStore((state) => state.user?.role.code)
  const isAllowed = role !== undefined && allow.includes(role)

  return isAllowed ? <>{children}</> : <Navigate to={redirectTo} replace />
}
