import React, { useState } from 'react'
import { usePathStore } from '../store/path.store'

interface CreatePathModalProps {
  onClose: () => void
}

export const CreatePathModal: React.FC<CreatePathModalProps> = ({ onClose }) => {
  const { createPath } = usePathStore()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title) return
    setIsSubmitting(true)
    const success = await createPath(title, description)
    setIsSubmitting(false)
    if (success) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-crehana-darkBg/60 backdrop-blur-md">
      <div className="w-full max-w-md p-6 rounded-3xl border border-crehana-cardBorder bg-[#18152D] glass shadow-[0_20px_50px_rgba(0,0,0,0.55)]">
        <h3 className="text-xl font-bold text-white mb-4 tracking-tight">Nueva Ruta de Aprendizaje</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Onboarding Backend Developer"
              className="w-full px-4 py-3 rounded-xl bg-crehana-darkBg border border-crehana-cardBorder/50 text-white placeholder-gray-500 focus:outline-none focus:border-crehana-mora focus:ring-1 focus:ring-crehana-mora/50 transition-all text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre el alcance, tecnologías a cubrir..."
              className="w-full px-4 py-3 rounded-xl bg-crehana-darkBg border border-crehana-cardBorder/50 text-white placeholder-gray-500 focus:outline-none focus:border-crehana-mora focus:ring-1 focus:ring-crehana-mora/50 transition-all text-sm h-24 resize-none"
            />
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-crehana-mora to-indigo-600 hover:from-indigo-600 hover:to-crehana-mora text-white text-sm font-bold transition-all shadow-[0_4px_15px_rgba(75,34,244,0.25)] cursor-pointer hover-scale disabled:opacity-50"
            >
              {isSubmitting ? 'Creando...' : 'Crear Ruta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
