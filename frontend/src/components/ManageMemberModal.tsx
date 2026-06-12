import React, { useState } from 'react'
import { usePathStore } from '../store/path.store'
import type { User } from '../models'
import { Eye, EyeOff } from 'lucide-react'

interface ManageMemberModalProps {
  member: User
  onClose: () => void
}

export const ManageMemberModal: React.FC<ManageMemberModalProps> = ({ member, onClose }) => {
  const { updateMember, deleteMember } = usePathStore()
  const [name, setName] = useState(member.name)
  const [email, setEmail] = useState(member.email)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getPasswordStrength = () => {
    if (!password) return null

    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^A-Za-z0-9]/.test(password)) score++

    if (password.length < 8) {
      return {
        label: 'Muy Baja (Mínimo 8 caracteres)',
        color: 'text-crehana-coral',
        barColor: 'bg-crehana-coral',
        width: 'w-1/4',
      }
    }

    if (score <= 1) {
      return {
        label: 'Baja',
        color: 'text-crehana-coral',
        barColor: 'bg-crehana-coral',
        width: 'w-1/2',
      }
    } else if (score === 2 || score === 3) {
      return {
        label: 'Media',
        color: 'text-amber-500',
        barColor: 'bg-amber-500',
        width: 'w-3/4',
      }
    } else {
      return {
        label: 'Alta',
        color: 'text-emerald-500',
        barColor: 'bg-emerald-500',
        width: 'w-full',
      }
    }
  }

  const renderStrengthMeter = () => {
    const strength = getPasswordStrength()
    if (!strength) return null

    return (
      <div className="mt-1.5 space-y-1">
        <div className="flex justify-between items-center text-[10px] font-bold">
          <span className="text-gray-400 uppercase tracking-wider">Seguridad</span>
          <span className={strength.color}>{strength.label}</span>
        </div>
        <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${strength.barColor} ${strength.width}`} />
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email) return
    if (password && password.length < 8) return
    setIsSubmitting(true)
    const success = await updateMember(member.id, name, email, password || undefined)
    setIsSubmitting(false)
    if (success) {
      onClose()
    }
  }

  const handleDeactivate = async () => {
    if (confirm('¿Estás seguro de que deseas desactivar esta cuenta de miembro? El usuario no podrá acceder y sus actividades asignadas quedarán libres.')) {
      setIsSubmitting(true)
      const success = await deleteMember(member.id)
      setIsSubmitting(false)
      if (success) {
        onClose()
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-crehana-darkBg/60 backdrop-blur-md">
      <div className="w-full max-w-md p-6 rounded-3xl border border-crehana-cardBorder bg-[#18152D] glass shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
        <h3 className="text-xl font-bold text-white mb-4 tracking-tight">Gestionar Miembro</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Nombre Completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Max Member"
              className="w-full px-4 py-3 rounded-xl bg-crehana-darkBg border border-crehana-cardBorder/50 text-white placeholder-gray-500 focus:outline-none focus:border-crehana-mora focus:ring-1 focus:ring-crehana-mora/50 transition-all text-sm"
              required
              disabled={!member.is_active}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Correo Electrónico</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="miembro@learnflow.dev"
              className="w-full px-4 py-3 rounded-xl bg-crehana-darkBg border border-crehana-cardBorder/50 text-white placeholder-gray-500 focus:outline-none focus:border-crehana-mora focus:ring-1 focus:ring-crehana-mora/50 transition-all text-sm"
              required
              disabled={!member.is_active}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Nueva Contraseña (Opcional)</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Dejar en blanco para conservar"
                className="w-full pl-4 pr-12 py-3 rounded-xl bg-crehana-darkBg border border-crehana-cardBorder/50 text-white placeholder-gray-500 focus:outline-none focus:border-crehana-mora focus:ring-1 focus:ring-crehana-mora/50 transition-all text-sm"
                minLength={8}
                disabled={!member.is_active}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-800 disabled:opacity-50"
                disabled={!member.is_active}
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
            {renderStrengthMeter()}
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-crehana-border/30 gap-3">
            {member.is_active ? (
              <button
                type="button"
                onClick={handleDeactivate}
                className="px-4 py-2.5 rounded-xl text-sm font-bold bg-crehana-coral/10 text-crehana-coral border border-crehana-coral/30 hover:bg-crehana-coral hover:text-white transition-all cursor-pointer"
                disabled={isSubmitting}
              >
                Desactivar Cuenta
              </button>
            ) : (
              <span className="text-xs font-bold text-crehana-coral uppercase tracking-wider bg-crehana-coral/10 px-3 py-1 rounded-full">
                Cuenta Inactiva
              </span>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              {member.is_active && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-crehana-menta to-emerald-500 hover:from-emerald-500 hover:to-crehana-menta text-crehana-darkBg text-sm font-extrabold transition-all shadow-[0_4px_15px_rgba(0,232,143,0.25)] cursor-pointer hover-scale disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
