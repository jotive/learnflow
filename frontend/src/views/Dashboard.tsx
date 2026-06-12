import React, { useEffect, useState } from 'react'
import { useIsLeader } from '../store/auth.store'
import { usePathStore } from '../store/path.store'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, UserPlus, BookOpen, CheckCircle, 
  AlertTriangle, Folder, ChevronRight, Trash2
} from 'lucide-react'
import { CreatePathModal } from '../components/CreatePathModal'
import { ProvisionMemberModal } from '../components/ProvisionMemberModal'

export const Dashboard: React.FC = () => {
  const isLeader = useIsLeader()
  const { paths, fetchPaths, deletePath, isLoading } = usePathStore()
  const navigate = useNavigate()

  const [isPathModalOpen, setIsPathModalOpen] = useState(false)
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 6

  useEffect(() => {
    fetchPaths()
  }, [fetchPaths])

  const handleDeletePath = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('¿Estás seguro de que deseas eliminar esta ruta de aprendizaje? Se borrarán todas sus actividades asociadas.')) {
      await deletePath(id)
    }
  }

  const totalPaths = paths.length
  const completedPaths = paths.filter(p => p.completed_at).length
  const pendingCompliance = paths.filter(p => !p.is_compliant).length

  const totalPages = Math.ceil(paths.length / ITEMS_PER_PAGE)
  const paginatedPaths = paths.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full transition-colors duration-200 scrollbar-none">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-crehana-text">Rutas de Aprendizaje</h2>
          <p className="text-crehana-text-muted text-sm mt-1">
            {isLeader 
              ? 'Monitorea el progreso, cumplimiento y asignaciones de tu equipo en tiempo real.' 
              : 'Progreso de tus actividades y rutas de entrenamiento asignadas.'}
          </p>
        </div>

        {isLeader && (
          <div className="flex gap-3">
            <button
              onClick={() => setIsMemberModalOpen(true)}
              className="px-4 py-2.5 rounded-xl border border-crehana-border/50 bg-crehana-card hover:bg-crehana-menta/5 hover:border-crehana-menta/25 text-crehana-text text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer hover-scale"
            >
              <UserPlus className="w-4 h-4 text-crehana-menta" />
              <span>Registrar Miembro</span>
            </button>
            <button
              onClick={() => setIsPathModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-crehana-mora to-indigo-600 hover:from-indigo-600 hover:to-crehana-mora hover:shadow-[0_8px_25px_rgba(75,34,244,0.35)] text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-[0_4px_15px_rgba(75,34,244,0.15)] cursor-pointer hover-scale"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva Ruta</span>
            </button>
          </div>
        )}
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 rounded-2xl bg-crehana-panel border border-crehana-border flex items-center gap-5 shadow-sm hover:border-crehana-mora/40 shadow-glow-mora transition-all duration-300">
          <div className="p-4 rounded-xl bg-crehana-mora/10 text-crehana-mora border border-crehana-mora/20 shadow-[inset_0_2px_4px_rgba(75,34,244,0.05)]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-crehana-text-muted">Total Rutas</p>
            <h3 className="text-3xl font-extrabold mt-1 text-crehana-text tracking-tight">{totalPaths}</h3>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-crehana-panel border border-crehana-border flex items-center gap-5 shadow-sm hover:border-crehana-menta/40 shadow-glow-menta transition-all duration-300">
          <div className="p-4 rounded-xl bg-crehana-menta/10 text-crehana-menta border border-crehana-menta/20 shadow-[inset_0_2px_4px_rgba(0,232,143,0.05)]">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-crehana-text-muted">Rutas Firmadas</p>
            <h3 className="text-3xl font-extrabold mt-1 text-crehana-text tracking-tight">{completedPaths}</h3>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-crehana-panel border border-crehana-border flex items-center gap-5 shadow-sm hover:border-crehana-coral/40 shadow-glow-coral transition-all duration-300">
          <div className="p-4 rounded-xl bg-crehana-coral/10 text-crehana-coral border border-crehana-coral/20 shadow-[inset_0_2px_4px_rgba(255,63,86,0.05)]">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-crehana-text-muted">Con Pendientes</p>
            <h3 className="text-3xl font-extrabold mt-1 text-crehana-text tracking-tight">{pendingCompliance}</h3>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-extrabold text-lg text-crehana-text tracking-tight">Listado de Rutas</h4>
        </div>

        {isLoading && paths.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="p-6 rounded-2xl bg-crehana-card border border-crehana-border/50 h-[220px] flex flex-col justify-between animate-pulse"
              >
                <div className="space-y-4">
                  <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full w-24"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-lg w-full"></div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-lg w-5/6"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-lg w-1/4"></div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : paths.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center p-6 bg-crehana-card border border-crehana-border/50 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-crehana-border/50 flex items-center justify-center text-crehana-text-muted mb-4">
              <Folder className="w-8 h-8" />
            </div>
            <h5 className="font-semibold text-lg mb-1 text-crehana-text">No hay rutas de aprendizaje</h5>
            <p className="text-sm text-crehana-text-muted max-w-sm">
              {isLeader 
                ? 'Comienza creando tu primera ruta para asignarle actividades a los miembros de tu equipo.' 
                : 'Aún no se te han asignado actividades en ninguna ruta de aprendizaje.'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedPaths.map((path) => (
                <div
                  key={path.id}
                  onClick={() => navigate(`/paths/${path.id}`)}
                  className="p-6 rounded-2xl bg-crehana-card border border-crehana-border/50 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] hover:border-crehana-mora/20 hover:-translate-y-0.5 flex flex-col justify-between gap-6 transition-all duration-300 cursor-pointer group relative overflow-hidden"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-3">
                      <h5 className="font-extrabold text-crehana-text group-hover:text-crehana-mora transition-colors text-lg tracking-tight leading-snug line-clamp-2 pr-6">
                        {path.title}
                      </h5>
                      <ChevronRight className="w-5 h-5 text-crehana-text-muted group-hover:text-crehana-text group-hover:translate-x-0.5 transition-all shrink-0 absolute top-6 right-6" />
                    </div>
                    
                    <div>
                      {path.completed_at ? (
                        <span className="inline-flex text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full bg-gray-500/10 text-crehana-text-muted border border-crehana-border/40 items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                          Firmada (Completada)
                        </span>
                      ) : (
                        <span className={`inline-flex text-[9px] font-extrabold tracking-wider uppercase px-2.5 py-1 rounded-full items-center gap-1 border ${
                          path.is_compliant 
                            ? 'bg-crehana-menta/10 text-crehana-menta border-crehana-menta/20' 
                            : 'bg-crehana-coral/10 text-crehana-coral border-crehana-coral/20'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${path.is_compliant ? 'bg-crehana-menta' : 'bg-crehana-coral'}`} />
                          {path.is_compliant ? 'Cumplimiento Habilitado' : 'Pendiente Obligatorio'}
                        </span>
                      )}
                    </div>

                    {path.description && (
                      <p className="text-xs text-crehana-text-muted line-clamp-3 leading-relaxed">{path.description}</p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-crehana-border/30 space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-crehana-text">Progreso</span>
                      <span className="text-crehana-text-muted font-medium">
                        {path.progress_percentage}% ({path.activity_count} {path.activity_count === 1 ? 'actividad' : 'actividades'})
                      </span>
                    </div>
                    <div className="bg-crehana-border/40 h-2 rounded-full overflow-hidden w-full">
                      <div 
                        className="bg-gradient-to-r from-crehana-mora to-crehana-menta h-full rounded-full transition-all duration-500" 
                        style={{ width: `${path.progress_percentage}%` }}
                      />
                    </div>
                  </div>

                  {isLeader && !path.completed_at && (
                    <button
                      onClick={(e) => handleDeletePath(path.id, e)}
                      className="p-2 rounded-xl text-crehana-text-muted hover:text-crehana-coral hover:bg-crehana-coral/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100 absolute bottom-14 right-6 bg-crehana-card/80 backdrop-blur-sm border border-crehana-border/30"
                      title="Eliminar Ruta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 pt-4 border-t border-crehana-border/30">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-3 py-1.5 rounded-lg border border-crehana-border text-xs font-bold text-crehana-text hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      currentPage === page
                        ? 'bg-crehana-mora text-white shadow-[0_2px_10px_rgba(75,34,244,0.3)]'
                        : 'border border-crehana-border text-crehana-text hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="px-3 py-1.5 rounded-lg border border-crehana-border text-xs font-bold text-crehana-text hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  Siguiente
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {isPathModalOpen && <CreatePathModal onClose={() => setIsPathModalOpen(false)} />}
      {isMemberModalOpen && <ProvisionMemberModal onClose={() => setIsMemberModalOpen(false)} />}
    </div>
  )
}
