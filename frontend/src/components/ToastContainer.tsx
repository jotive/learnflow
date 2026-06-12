import React from 'react'
import { useToastStore, type Toast } from '../store/toast.store'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore()

  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-crehana-darkCard/95 border-crehana-menta/50 text-white shadow-[0_0_15px_rgba(0,232,143,0.15)]',
          icon: <CheckCircle className="w-5 h-5 text-crehana-menta shrink-0" />,
        }
      case 'error':
        return {
          container: 'bg-crehana-darkCard/95 border-crehana-coral/50 text-white shadow-[0_0_15px_rgba(255,63,86,0.15)]',
          icon: <AlertCircle className="w-5 h-5 text-crehana-coral shrink-0" />,
        }
      case 'info':
        return {
          container: 'bg-crehana-darkCard/95 border-crehana-mora/50 text-white shadow-[0_0_15px_rgba(75,34,244,0.15)]',
          icon: <Info className="w-5 h-5 text-crehana-mora shrink-0" />,
        }
    }
  }

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const styles = getToastStyles(toast.type)
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 p-4 rounded-xl border glass ${styles.container} animate-slide-in hover-scale`}
          >
            {styles.icon}
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-md text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
