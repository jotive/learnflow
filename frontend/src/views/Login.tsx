import React, { useState } from 'react'
import { useAuthStore } from '../store/auth.store'
import { useNavigate } from 'react-router-dom'
import { LogIn, UserCheck, ShieldAlert } from 'lucide-react'

export const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { login, isLoading } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    const success = await login(email, password)
    if (success) {
      navigate('/')
    }
  }

  const handleQuickFill = (role: 'LEADER' | 'MEMBER1' | 'MEMBER2') => {
    if (role === 'LEADER') {
      setEmail('leader@learnflow.dev')
      setPassword('leader-pass')
    } else if (role === 'MEMBER1') {
      setEmail('member1@learnflow.dev')
      setPassword('member-pass')
    } else {
      setEmail('member2@learnflow.dev')
      setPassword('member-pass')
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-crehana-darkBg via-[#120D26] to-[#1D173C] p-4 relative overflow-hidden font-sans">
      {/* Círculos decorativos de fondo con desenfoque neón */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-crehana-mora/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-crehana-coral/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md p-8 rounded-2xl border border-crehana-cardBorder/30 glass relative z-10 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-crehana-mora to-crehana-coral/80 mb-3 shadow-[0_4px_15px_rgba(75,34,244,0.3)]">
            <span className="text-2xl font-bold text-white tracking-widest uppercase">LF</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight leading-none mb-1">LearnFlow</h1>
          <p className="text-sm text-gray-400">Rastreador de Rutas de Aprendizaje Corporativo</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@learnflow.dev"
              className="w-full px-4 py-3 rounded-xl bg-crehana-darkBg/60 border border-crehana-cardBorder/40 text-white placeholder-gray-500 focus:outline-none focus:border-crehana-mora focus:ring-1 focus:ring-crehana-mora transition-all text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-crehana-darkBg/60 border border-crehana-cardBorder/40 text-white placeholder-gray-500 focus:outline-none focus:border-crehana-mora focus:ring-1 focus:ring-crehana-mora transition-all text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-crehana-mora to-indigo-600 hover:from-indigo-600 hover:to-crehana-mora text-white font-semibold text-sm transition-all duration-300 shadow-[0_4px_20px_rgba(75,34,244,0.25)] hover:shadow-[0_4px_25px_rgba(75,34,244,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                Ingresar
              </>
            )}
          </button>
        </form>

        {/* Separador */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-crehana-cardBorder/30"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-[#18152D] px-3 text-gray-400">Demostración Rápida</span>
          </div>
        </div>

        {/* Accesos Rápidos de Demo */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleQuickFill('LEADER')}
            className="py-2.5 px-1 rounded-xl bg-crehana-darkBg/50 hover:bg-crehana-mora/20 border border-crehana-cardBorder/20 hover:border-crehana-mora/40 text-white transition-all text-xs font-medium flex flex-col items-center gap-1 cursor-pointer hover-scale"
          >
            <ShieldAlert className="w-4 h-4 text-crehana-coral" />
            <span>Líder</span>
          </button>

          <button
            onClick={() => handleQuickFill('MEMBER1')}
            className="py-2.5 px-1 rounded-xl bg-crehana-darkBg/50 hover:bg-crehana-mora/20 border border-crehana-cardBorder/20 hover:border-crehana-mora/40 text-white transition-all text-xs font-medium flex flex-col items-center gap-1 cursor-pointer hover-scale"
          >
            <UserCheck className="w-4 h-4 text-crehana-menta" />
            <span>Miembro 1</span>
          </button>

          <button
            onClick={() => handleQuickFill('MEMBER2')}
            className="py-2.5 px-1 rounded-xl bg-crehana-darkBg/50 hover:bg-crehana-mora/20 border border-crehana-cardBorder/20 hover:border-crehana-mora/40 text-white transition-all text-xs font-medium flex flex-col items-center gap-1 cursor-pointer hover-scale"
          >
            <UserCheck className="w-4 h-4 text-crehana-menta" />
            <span>Miembro 2</span>
          </button>
        </div>
      </div>
    </div>
  )
}
