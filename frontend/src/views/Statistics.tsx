import React, { useEffect } from 'react'
import { usePathStore } from '../store/path.store'
import { BarChart2, AlertTriangle, TrendingUp, BookOpen, Award } from 'lucide-react'

export const Statistics: React.FC = () => {
  const { paths, fetchPaths, isLoading } = usePathStore()

  useEffect(() => {
    fetchPaths()
  }, [fetchPaths])

  const totalPaths = paths.length
  const completedPaths = paths.filter((p) => p.completed_at).length
  const compliantPaths = paths.filter((p) => p.is_compliant && !p.completed_at).length
  const nonCompliantPaths = paths.filter((p) => !p.is_compliant && !p.completed_at).length

  const totalActivities = paths.reduce((sum, p) => sum + p.activity_count, 0)
  const averageProgress = totalPaths
    ? Math.round(paths.reduce((sum, p) => sum + p.progress_percentage, 0) / totalPaths)
    : 0

  const averageActivitiesPerPath = totalPaths ? Math.round(totalActivities / totalPaths) : 0

  if (isLoading && paths.length === 0) {
    return (
      <div className="flex-1 p-8 overflow-y-auto w-full transition-colors duration-200 scrollbar-none">
        <header className="mb-8">
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-48 animate-pulse mb-2"></div>
          <div className="h-4 bg-slate-100 dark:bg-slate-900 rounded-lg w-96 animate-pulse"></div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-crehana-panel border border-crehana-border flex items-center gap-5 shadow-sm animate-pulse h-24"
            >
              <div className="p-4 rounded-xl bg-slate-200 dark:bg-slate-800 w-12 h-12"></div>
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-lg w-20"></div>
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-8"></div>
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="p-6 rounded-2xl bg-crehana-card border border-crehana-border shadow-sm space-y-6 animate-pulse h-56">
            <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-lg w-1/2"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-full"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-crehana-card border border-crehana-border shadow-sm flex flex-col justify-between animate-pulse h-56">
            <div className="space-y-4">
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
              <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-lg w-2/3"></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-xl bg-slate-200 dark:bg-slate-800 h-16"></div>
              <div className="p-4 rounded-xl bg-slate-200 dark:bg-slate-800 h-16"></div>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-48 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-5 rounded-2xl bg-crehana-card border border-crehana-border/50 h-32 flex flex-col justify-between"
              >
                <div className="flex justify-between items-start">
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-full w-16"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-lg w-12"></div>
                  <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full w-full"></div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full transition-colors duration-200 scrollbar-none">
      <header className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-crehana-text">Estadísticas de Aprendizaje</h2>
        <p className="text-crehana-text-muted text-sm mt-1">
          Análisis del progreso general, cumplimiento y rendimiento de las rutas de tu equipo.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="p-6 rounded-2xl bg-crehana-panel border border-crehana-border flex items-center gap-5 shadow-sm">
          <div className="p-4 rounded-xl bg-crehana-mora/10 text-crehana-mora border border-crehana-mora/20">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-crehana-text-muted">Rutas Activas</p>
            <h3 className="text-3xl font-extrabold mt-1 text-crehana-text">{totalPaths}</h3>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-crehana-panel border border-crehana-border flex items-center gap-5 shadow-sm">
          <div className="p-4 rounded-xl bg-crehana-menta/10 text-crehana-menta border border-crehana-menta/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-crehana-text-muted">Rutas Firmadas</p>
            <h3 className="text-3xl font-extrabold mt-1 text-crehana-text">{completedPaths}</h3>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-crehana-panel border border-crehana-border flex items-center gap-5 shadow-sm">
          <div className="p-4 rounded-xl bg-crehana-coral/10 text-crehana-coral border border-crehana-coral/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-crehana-text-muted">Con Pendientes</p>
            <h3 className="text-3xl font-extrabold mt-1 text-crehana-text">{nonCompliantPaths}</h3>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-crehana-panel border border-crehana-border flex items-center gap-5 shadow-sm">
          <div className="p-4 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-crehana-text-muted">Progreso Promedio</p>
            <h3 className="text-3xl font-extrabold mt-1 text-crehana-text">{averageProgress}%</h3>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="p-6 rounded-2xl bg-crehana-card border border-crehana-border shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <BarChart2 className="w-5 h-5 text-crehana-mora" />
            <h4 className="font-bold text-lg text-crehana-text">Estado de Cumplimiento de las Rutas</h4>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1 text-crehana-text">
                <span>Firmadas y Completas ({completedPaths})</span>
                <span>{totalPaths ? Math.round((completedPaths / totalPaths) * 100) : 0}%</span>
              </div>
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-crehana-menta rounded-full"
                  style={{ width: `${totalPaths ? (completedPaths / totalPaths) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1 text-crehana-text">
                <span>Cumplimiento Habilitado ({compliantPaths})</span>
                <span>{totalPaths ? Math.round((compliantPaths / totalPaths) * 100) : 0}%</span>
              </div>
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-crehana-mora rounded-full"
                  style={{ width: `${totalPaths ? (compliantPaths / totalPaths) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1 text-crehana-text">
                <span>Pendientes Obligatorios ({nonCompliantPaths})</span>
                <span>{totalPaths ? Math.round((nonCompliantPaths / totalPaths) * 100) : 0}%</span>
              </div>
              <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-crehana-coral rounded-full"
                  style={{ width: `${totalPaths ? (nonCompliantPaths / totalPaths) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-crehana-card border border-crehana-border shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-crehana-mora" />
              <h4 className="font-bold text-lg text-crehana-text">Resumen Operativo</h4>
            </div>
            <p className="text-xs text-crehana-text-muted leading-relaxed">
              Métricas clave de las actividades y rutas asignadas en el sistema.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-crehana-panel border border-crehana-border text-center">
              <span className="text-[10px] font-bold text-crehana-text-muted uppercase tracking-wider">Total Actividades</span>
              <h4 className="text-2xl font-extrabold mt-1 text-crehana-text">{totalActivities}</h4>
            </div>
            <div className="p-4 rounded-xl bg-crehana-panel border border-crehana-border text-center">
              <span className="text-[10px] font-bold text-crehana-text-muted uppercase tracking-wider">Promedio por Ruta</span>
              <h4 className="text-2xl font-extrabold mt-1 text-crehana-text">{averageActivitiesPerPath}</h4>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h4 className="font-extrabold text-lg text-crehana-text tracking-tight">Rendimiento por Ruta</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paths.map((path) => (
            <div key={path.id} className="p-5 rounded-2xl bg-crehana-card border border-crehana-border/50 flex flex-col justify-between gap-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h5 className="font-bold text-crehana-text truncate text-base">{path.title}</h5>
                  <span className="text-xs text-crehana-text-muted">{path.activity_count} actividades en total</span>
                </div>
                {path.completed_at ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-gray-500/10 text-crehana-text-muted border border-crehana-border">
                    Completada
                  </span>
                ) : (
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                    path.is_compliant 
                      ? 'bg-crehana-menta/15 text-crehana-menta border-crehana-menta/25'
                      : 'bg-crehana-coral/15 text-crehana-coral border-crehana-coral/25'
                  }`}>
                    {path.is_compliant ? 'Cumplimiento Habilitado' : 'Pendientes'}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-crehana-text">
                  <span>Progreso</span>
                  <span>{path.progress_percentage}%</span>
                </div>
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-crehana-mora rounded-full"
                    style={{ width: `${path.progress_percentage}%` }}
                  />
                </div>
              </div>
            </div>
          ))}

          {paths.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm text-crehana-text-muted italic bg-crehana-card border border-crehana-border rounded-2xl">
              No hay rutas disponibles para analizar.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
