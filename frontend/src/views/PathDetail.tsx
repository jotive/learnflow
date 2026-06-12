import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore, useIsLeader } from '../store/auth.store'
import { usePathStore, type Activity } from '../store/path.store'
import { 
  ArrowLeft, Plus, CheckSquare, Clock, 
  Trash2, Award, ShieldAlert, SlidersHorizontal, CheckCircle2,
  Play, Check, RefreshCw
} from 'lucide-react'
import { CreateActivityModal } from '../components/CreateActivityModal'
import { MemberAssigneeSelect } from '../components/MemberAssigneeSelect'

export const PathDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const isLeader = useIsLeader()
  const {
    currentPath, activities, progressPercentage, members, isLoading,
    fetchPathDetails, fetchActivities, fetchMembers, signOffPath,
    updateActivityStatus, assignActivity, deleteActivity 
  } = usePathStore()

  // Estados de filtros
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false)
  const [draggingColumn, setDraggingColumn] = useState<string | null>(null)
  const [draggedActivityId, setDraggedActivityId] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchPathDetails(id)
      fetchActivities(id, {
        status: statusFilter || undefined,
        priority: priorityFilter || undefined
      })
      if (user?.role.code === 'LEADER') {
        fetchMembers()
      }
    }
  }, [id, statusFilter, priorityFilter, fetchPathDetails, fetchActivities, fetchMembers, user])

  const handleStatusChange = async (activityId: string, newStatus: Activity['status']) => {
    if (!id) return
    await updateActivityStatus(activityId, id, newStatus)
  }

  const handleAssignMember = async (activityId: string, memberId: string | null) => {
    if (!id) return
    await assignActivity(activityId, id, memberId)
  }

  const handleDeleteActivity = async (activityId: string) => {
    if (!id) return
    if (confirm('¿Estás seguro de que deseas eliminar esta actividad?')) {
      await deleteActivity(activityId, id)
    }
  }

  const handleSignOff = async () => {
    if (!id) return
    if (confirm('¿Confirmas que deseas firmar el cumplimiento de esta ruta de aprendizaje?')) {
      await signOffPath(id)
    }
  }

  const handleDragStart = (e: React.DragEvent, activityId: string) => {
    e.dataTransfer.setData('text/plain', activityId)
    setDraggedActivityId(activityId)
  }

  const handleDragEnd = () => {
    setDraggedActivityId(null)
    setDraggingColumn(null)
  }

  const handleDragOver = (e: React.DragEvent, column: Activity['status']) => {
    e.preventDefault()
    if (draggingColumn !== column) {
      setDraggingColumn(column)
    }
  }

  const handleDragLeave = () => {
    setDraggingColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, targetStatus: Activity['status']) => {
    e.preventDefault()
    setDraggedActivityId(null)
    setDraggingColumn(null)
    const activityId = e.dataTransfer.getData('text/plain')
    if (!activityId || !id) return

    const activity = activities.find(a => a.id === activityId)
    if (!activity) return

    const isAssignedToMe = activity.assigned_to === user?.id
    if (user?.role.code !== 'LEADER' && !isAssignedToMe) {
      return
    }

    if (activity.status !== targetStatus) {
      await updateActivityStatus(activityId, id, targetStatus)
    }
  }

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'HIGH':
        return 'bg-crehana-coral/10 text-crehana-coral border border-crehana-coral/20'
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
      case 'LOW':
        return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border border-gray-500/25'
    }
  }

  // Separar actividades para el tablero Kanban
  const notStartedActivities = activities.filter(a => a.status === 'NOT_STARTED')
  const inProgressActivities = activities.filter(a => a.status === 'IN_PROGRESS')
  const completedActivities = activities.filter(a => a.status === 'COMPLETED')

  if (isLoading && !currentPath) {
    return (
      <div className="flex-1 p-8 overflow-y-auto w-full animate-pulse scrollbar-none bg-crehana-bg">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-28 mb-6"></div>

        <section className="bg-crehana-panel border border-crehana-border rounded-2xl p-8 mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 shadow-sm">
          <div className="flex-1 min-w-0 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-8 bg-slate-300 dark:bg-slate-700 rounded-lg w-1/3"></div>
              <div className="h-6 bg-slate-300 dark:bg-slate-700 rounded-full w-24"></div>
            </div>
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/2"></div>
            <div className="pt-2 max-w-md space-y-2">
              <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-lg w-24"></div>
              <div className="h-3 bg-slate-300 dark:bg-slate-700 rounded-full w-full"></div>
            </div>
          </div>
        </section>

        <section className="h-14 bg-crehana-panel border border-crehana-border rounded-xl p-4 mb-6"></section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((col) => (
            <div key={col} className="bg-crehana-panel border border-crehana-border rounded-xl p-4 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-crehana-border pb-2.5">
                <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded-lg w-24"></div>
                <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded-full w-6"></div>
              </div>
              <div className="space-y-3">
                {[1, 2].map((card) => (
                  <div key={card} className="p-4 rounded-xl bg-crehana-card border border-crehana-border/50 h-32 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-10"></div>
                      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-16"></div>
                    </div>
                    <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3"></div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-lg w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!currentPath) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-crehana-bg p-6 text-center">
        <ShieldAlert className="w-12 h-12 text-crehana-coral mb-4" />
        <h3 className="text-xl font-bold text-crehana-text mb-2">Ruta no encontrada</h3>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-crehana-mora text-white text-sm font-semibold hover-scale cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
        </button>
      </div>
    )
  }

  const renderActivityCard = (activity: Activity) => {
    const isAssignedToMe = activity.assigned_to === user?.id
    const assignedMember = members.find(m => m.id === activity.assigned_to)
    const isDraggable = !currentPath.completed_at && (isLeader || isAssignedToMe)

    return (
      <div 
        key={activity.id}
        draggable={isDraggable}
        onDragStart={(e) => handleDragStart(e, activity.id)}
        onDragEnd={handleDragEnd}
        className={`p-4 rounded-xl bg-crehana-card border border-crehana-border/50 hover:border-crehana-mora/50 transition-all shadow-sm group relative flex flex-col justify-between gap-4 hover:z-20 focus-within:z-20 ${
          isDraggable ? 'cursor-grab active:cursor-grabbing hover:-translate-y-0.5' : ''
        } ${draggedActivityId && draggedActivityId !== activity.id ? 'pointer-events-none' : ''} ${draggedActivityId === activity.id ? 'opacity-30' : ''}`}
      >
        {activity.status === 'COMPLETED' && (
          <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none rounded-xl" />
        )}
        
        <div className="space-y-3 relative z-10">
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-mono text-crehana-text-muted bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                #{activity.position}
              </span>
              {activity.is_mandatory && (
                <span className="text-xs font-medium text-crehana-coral border border-crehana-coral/30 bg-crehana-coral/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 shrink-0" />
                  Obligatorio
                </span>
              )}
            </div>
            {isLeader && !currentPath.completed_at && (
              <button
                onClick={() => handleDeleteActivity(activity.id)}
                className="p-1.5 rounded-lg text-crehana-text-muted hover:text-crehana-coral hover:bg-crehana-coral/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100 shrink-0"
                title="Eliminar Actividad"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div>
            <h3 className={`font-semibold text-crehana-text text-sm leading-snug ${activity.status === 'COMPLETED' ? 'line-through decoration-crehana-text-muted/50 text-crehana-text-muted' : ''}`}>
              {activity.title}
            </h3>
            {activity.description && (
              <p className="text-xs text-crehana-text-muted mt-1.5 leading-relaxed line-clamp-2" title={activity.description}>
                {activity.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-crehana-border/30">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${getPriorityBadge(activity.priority)}`}>
              {activity.priority === 'HIGH' ? 'Alta' : activity.priority === 'MEDIUM' ? 'Media' : 'Baja'}
            </span>

            {isLeader && !currentPath.completed_at ? (
              <MemberAssigneeSelect
                assignedTo={activity.assigned_to}
                members={members}
                onAssign={(userId) => handleAssignMember(activity.id, userId)}
                onUnassign={() => handleAssignMember(activity.id, null)}
              />
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 border border-crehana-border px-2.5 py-1 rounded-lg text-xs text-crehana-text-muted">
                <div className="w-5 h-5 rounded-full bg-crehana-mora/10 text-crehana-mora flex items-center justify-center text-[9px] font-bold border border-crehana-mora/15 shrink-0">
                  {assignedMember ? assignedMember.name.substring(0, 2).toUpperCase() : '?'}
                </div>
                <span className="truncate">{assignedMember ? assignedMember.name : 'Sin asignar'}</span>
              </div>
            )}
          </div>
        </div>

        {!currentPath.completed_at && isAssignedToMe && (
          <div className="pt-2 border-t border-crehana-border/30 flex justify-end relative z-10">
            <div className="flex gap-1.5">
              {activity.status === 'NOT_STARTED' && (
                <button
                  onClick={() => handleStatusChange(activity.id, 'IN_PROGRESS')}
                  className="px-3 py-1.5 rounded-lg bg-crehana-mora/10 text-crehana-mora hover:bg-crehana-mora hover:text-white text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer hover-scale"
                >
                  <Play className="w-3 h-3 fill-current" /> Comenzar
                </button>
              )}
              {activity.status === 'IN_PROGRESS' && (
                <>
                  <button
                    onClick={() => handleStatusChange(activity.id, 'NOT_STARTED')}
                    className="px-2.5 py-1 rounded-lg border border-crehana-border hover:bg-crehana-border text-crehana-text text-[10px] font-medium transition-all cursor-pointer"
                  >
                    Pausar
                  </button>
                  <button
                    onClick={() => handleStatusChange(activity.id, 'COMPLETED')}
                    className="px-3 py-1.5 rounded-lg bg-crehana-menta/10 text-crehana-menta hover:bg-crehana-menta dark:hover:text-crehana-darkBg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer hover-scale"
                  >
                    <Check className="w-3 h-3" /> Terminar
                  </button>
                </>
              )}
              {activity.status === 'COMPLETED' && (
                <button
                  onClick={() => handleStatusChange(activity.id, 'IN_PROGRESS')}
                  className="px-3 py-1.5 rounded-lg border border-crehana-border hover:bg-crehana-card text-crehana-text-muted hover:text-crehana-text text-[10px] font-medium flex items-center gap-1 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 text-crehana-mora" /> Reabrir
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full transition-colors duration-200 scrollbar-none">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-crehana-text-muted hover:text-crehana-text mb-6 group cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Volver a Rutas</span>
      </button>

      <section className="bg-crehana-panel border border-crehana-border rounded-2xl p-8 mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 shadow-sm">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-4 mb-2">
            <h1 className="text-3xl font-extrabold text-crehana-text tracking-tight truncate">
              {currentPath.title}
            </h1>
            {currentPath.completed_at ? (
              <span className="bg-gray-500/10 text-crehana-text-muted border border-crehana-border/50 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shrink-0">
                <Award className="w-3.5 h-3.5" />
                Firmada el {new Date(currentPath.completed_at).toLocaleDateString()}
              </span>
            ) : (
              <span className={`text-xs font-medium px-3 py-1 rounded-full border flex items-center gap-1.5 shrink-0 ${
                currentPath.is_compliant 
                  ? 'bg-crehana-menta/15 text-crehana-menta border-crehana-menta/30' 
                  : 'bg-crehana-coral/15 text-crehana-coral border-crehana-coral/30'
              }`}>
                {currentPath.is_compliant ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {currentPath.is_compliant ? 'Cumplimiento Habilitado' : 'Pendiente Obligatorio'}
              </span>
            )}
          </div>
          {currentPath.description && (
            <p className="text-crehana-text-muted text-sm mb-6 max-w-3xl">{currentPath.description}</p>
          )}

          <div className="w-full max-w-md">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-crehana-text font-medium">Progreso General</span>
              <span className="text-crehana-text-muted">{progressPercentage}% ({currentPath.activity_count} {currentPath.activity_count === 1 ? 'actividad' : 'actividades'})</span>
            </div>
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-crehana-mora rounded-full transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {isLeader && (
          <div className="flex flex-col items-end gap-2 shrink-0">
            {!currentPath.completed_at ? (
              <>
                <button
                  onClick={handleSignOff}
                  disabled={!currentPath.is_compliant}
                  className={`px-6 py-3 rounded-xl border font-medium text-sm transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                    currentPath.is_compliant
                      ? 'bg-crehana-mora hover:bg-indigo-500 border-transparent text-white shadow-[0_4px_15px_rgba(99,102,241,0.25)] hover-scale'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-crehana-border cursor-not-allowed'
                  }`}
                >
                  <Award className="w-4 h-4 shrink-0" />
                  Firmar Cumplimiento
                </button>
                {!currentPath.is_compliant && (
                  <span className="text-xs text-crehana-coral">
                    <ShieldAlert className="w-3.5 h-3.5 inline mr-1 text-crehana-coral" />
                    Falta completar actividad obligatoria (*)
                  </span>
                )}
              </>
            ) : (
              <div className="px-6 py-3 rounded-xl bg-crehana-mora/10 border border-crehana-mora/20 text-center text-sm font-bold text-crehana-mora flex items-center gap-2">
                <Award className="w-5 h-5 animate-bounce" />
                Ruta Completada
              </div>
            )}
          </div>
        )}
      </section>

      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 bg-crehana-panel p-4 rounded-xl border border-crehana-border gap-4">
        <div className="flex items-center gap-3 text-crehana-text-muted">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="font-medium text-crehana-text">Filtros de Tablero</span>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-crehana-card border border-crehana-border text-crehana-text text-sm rounded-lg px-4 py-2 outline-none focus:border-crehana-mora appearance-none cursor-pointer"
          >
            <option value="">Todas las Columnas</option>
            <option value="NOT_STARTED">No Iniciado</option>
            <option value="IN_PROGRESS">En Progreso</option>
            <option value="COMPLETED">Completado</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-crehana-card border border-crehana-border text-crehana-text text-sm rounded-lg px-4 py-2 outline-none focus:border-crehana-mora appearance-none cursor-pointer"
          >
            <option value="">Todas las Prioridades</option>
            <option value="HIGH">Alta</option>
            <option value="MEDIUM">Media</option>
            <option value="LOW">Baja</option>
          </select>

          {isLeader && !currentPath.completed_at && (
            <button
              onClick={() => setIsActivityModalOpen(true)}
              className="bg-crehana-mora hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 cursor-pointer hover-scale"
            >
              <Plus className="w-4 h-4" /> Agregar Actividad
            </button>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
        {(statusFilter === '' || statusFilter === 'NOT_STARTED') && (
          <div 
            onDragOver={(e) => handleDragOver(e, 'NOT_STARTED')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'NOT_STARTED')}
            className={`bg-crehana-panel border rounded-xl flex flex-col min-h-[450px] max-h-[75vh] transition-all duration-300 scrollbar-none ${
              draggingColumn === 'NOT_STARTED' 
                ? 'border-crehana-mora bg-crehana-mora/5 border-dashed scale-[1.01] ring-2 ring-crehana-mora/20 animate-pulse' 
                : draggedActivityId
                  ? 'border-dashed border-crehana-mora/40 bg-crehana-panel/80'
                  : 'border-crehana-border'
            }`}
          >
            <div className="p-4 border-b border-crehana-border flex justify-between items-center bg-black/5 dark:bg-white/5 rounded-t-xl shrink-0">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-crehana-text-muted" />
                <h2 className="font-semibold text-sm text-crehana-text">No Iniciado</h2>
              </div>
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2.5 py-1 rounded-full">
                {notStartedActivities.length}
              </span>
            </div>
            <div className="p-3 pb-32 space-y-3 overflow-y-auto flex-1 scrollbar-none">
              {notStartedActivities.map(renderActivityCard)}
              {notStartedActivities.length === 0 && (
                <div className="py-8 text-center text-xs text-crehana-text-muted font-medium italic">Vacío</div>
              )}
            </div>
          </div>
        )}

        {(statusFilter === '' || statusFilter === 'IN_PROGRESS') && (
          <div 
            onDragOver={(e) => handleDragOver(e, 'IN_PROGRESS')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'IN_PROGRESS')}
            className={`bg-crehana-panel border rounded-xl flex flex-col min-h-[450px] max-h-[75vh] transition-all duration-300 scrollbar-none ${
              draggingColumn === 'IN_PROGRESS' 
                ? 'border-crehana-mora bg-crehana-mora/5 border-dashed scale-[1.01] ring-2 ring-crehana-mora/20 animate-pulse' 
                : draggedActivityId
                  ? 'border-dashed border-crehana-mora/40 bg-crehana-panel/80'
                  : 'border-crehana-border'
            }`}
          >
            <div className="p-4 border-b border-crehana-border flex justify-between items-center bg-black/5 dark:bg-white/5 rounded-t-xl shrink-0">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h2 className="font-semibold text-sm text-crehana-text">En Progreso</h2>
              </div>
              <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full border border-amber-500/30">
                {inProgressActivities.length}
              </span>
            </div>
            <div className="p-3 pb-32 space-y-3 overflow-y-auto flex-1 scrollbar-none">
              {inProgressActivities.map(renderActivityCard)}
              {inProgressActivities.length === 0 && (
                <div className="py-8 text-center text-xs text-crehana-text-muted font-medium italic">Vacío</div>
              )}
            </div>
          </div>
        )}

        {(statusFilter === '' || statusFilter === 'COMPLETED') && (
          <div 
            onDragOver={(e) => handleDragOver(e, 'COMPLETED')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, 'COMPLETED')}
            className={`bg-crehana-panel border rounded-xl flex flex-col min-h-[450px] max-h-[75vh] opacity-70 hover:opacity-100 transition-opacity duration-300 scrollbar-none ${
              draggingColumn === 'COMPLETED' 
                ? 'border-crehana-mora bg-crehana-mora/5 border-dashed scale-[1.01] ring-2 ring-crehana-mora/20 animate-pulse' 
                : draggedActivityId
                  ? 'border-dashed border-crehana-mora/40 bg-crehana-panel/80'
                  : 'border-crehana-border'
            }`}
          >
            <div className="p-4 border-b border-crehana-border flex justify-between items-center bg-black/5 dark:bg-white/5 rounded-t-xl shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <h2 className="font-semibold text-sm text-crehana-text">Completado</h2>
              </div>
              <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
                {completedActivities.length}
              </span>
            </div>
            <div className="p-3 pb-32 space-y-3 overflow-y-auto flex-1 scrollbar-none">
              {completedActivities.map(renderActivityCard)}
              {completedActivities.length === 0 && (
                <div className="py-8 text-center text-xs text-crehana-text-muted font-medium italic">Vacío</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal delegado */}
      {isActivityModalOpen && (
        <CreateActivityModal 
          pathId={id!} 
          defaultPosition={activities.length + 1} 
          onClose={() => setIsActivityModalOpen(false)} 
        />
      )}
    </div>
  )
}
