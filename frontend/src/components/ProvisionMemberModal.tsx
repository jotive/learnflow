import React, { useState } from 'react'
import { useAuthStore } from '../store/auth.store'
import { Eye, EyeOff } from 'lucide-react'

interface ProvisionMemberModalProps {
  onClose: () => void
}

export const ProvisionMemberModal: React.FC<ProvisionMemberModalProps> = ({ onClose }) => {
  const { provisionMember } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name || !email || !password || !confirmPassword) return
    
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setIsSubmitting(true)
    const success = await provisionMember(email, name, password)
    setIsSubmitting(false)
    if (success) {
      onClose()
    }
  }

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

  const getPasswordValidationMessage = () => {
    if (!password) return null

    if (password.length < 8) {
      return (
        <p className="text-[11px] font-bold text-crehana-coral mt-1">
          ⚠ Mínimo 8 caracteres (actual: {password.length})
        </p>
      )
    }

    if (!confirmPassword) return null

    if (password !== confirmPassword) {
      return (
        <p className="text-[11px] font-bold text-crehana-coral mt-1">
          ✕ Las contraseñas no coinciden
        </p>
      )
    }

    return (
      <p className="text-[11px] font-bold text-emerald-500 mt-1">
        ✓ Las contraseñas coinciden
      </p>
    )
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-crehana-darkBg/60 backdrop-blur-md">
      <div className="w-full max-w-md p-6 rounded-3xl border border-crehana-cardBorder bg-[#18152D] glass shadow-[0_20px_50px_rgba(0,0,0,0.55)] space-y-4">
        <h3 className="text-xl font-bold text-white tracking-tight">Registrar Nuevo Miembro</h3>
        
        {error && (
          <div className="p-3 text-xs font-bold text-crehana-coral bg-crehana-coral/10 border border-crehana-coral/20 rounded-xl">
            {error}
          </div>
        )}

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
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Contraseña Inicial</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="Mínimo 8 caracteres"
                className="w-full pl-4 pr-12 py-3 rounded-xl bg-crehana-darkBg border border-crehana-cardBorder/50 text-white placeholder-gray-500 focus:outline-none focus:border-crehana-mora focus:ring-1 focus:ring-crehana-mora/50 transition-all text-sm"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
            {renderStrengthMeter()}
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Confirmar Contraseña</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="Repite la contraseña"
                className="w-full pl-4 pr-12 py-3 rounded-xl bg-crehana-darkBg border border-crehana-cardBorder/50 text-white placeholder-gray-500 focus:outline-none focus:border-crehana-mora focus:ring-1 focus:ring-crehana-mora/50 transition-all text-sm"
                minLength={8}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
            {getPasswordValidationMessage()}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white transition-colors cursor-pointer"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-crehana-menta to-emerald-500 hover:from-emerald-500 hover:to-crehana-menta text-crehana-darkBg text-sm font-extrabold transition-all shadow-[0_4px_15px_rgba(0,232,143,0.25)] cursor-pointer hover-scale disabled:opacity-50"
            >
              {isSubmitting ? 'Registrando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
