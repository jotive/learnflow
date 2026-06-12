import React, { useEffect, useState } from 'react'
import { usePathStore } from '../store/path.store'
import { useAuthStore } from '../store/auth.store'
import { useNavigate } from 'react-router-dom'
import { 
  Users, UserPlus, Mail,
  ChevronLeft, ClipboardList, CheckCircle2, TrendingUp, Search,
  User, Clipboard, MoreHorizontal, ChevronRight
} from 'lucide-react'
import { ProvisionMemberModal } from '../components/ProvisionMemberModal'
import { ManageMemberModal } from '../components/ManageMemberModal'
import type { User as StoreUser } from '../models'

export const Team: React.FC = () => {
  const { members, fetchMembers, paths, fetchPaths, isLoading } = usePathStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<StoreUser | null>(null)
  
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'MEMBER' | 'LEADER'>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'>('ALL')
  const [sortBy, setSortBy] = useState<'RECENT' | 'NAME'>('RECENT')
  
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(8)
  
  const totalMembers = members.length

  useEffect(() => {
    fetchMembers()
    fetchPaths()
  }, [fetchMembers, fetchPaths])

  const isLeader = user?.role.code === 'LEADER'

  const getMemberAssignedCount = (memberId: string) => {
    let count = 0
    paths.forEach((p) => {
      if (p.activities) {
        p.activities.forEach((a) => {
          if (a.assigned_to === memberId) {
            count++
          }
        })
      }
    })
    return count
  }

  const getMemberCompletionProgress = (memberId: string) => {
    let total = 0
    let completed = 0
    paths.forEach((p) => {
      if (p.activities) {
        p.activities.forEach((a) => {
          if (a.assigned_to === memberId) {
            total++
            if (a.status === 'COMPLETED') {
              completed++
            }
          }
        })
      }
    })
    return total ? Math.round((completed / total) * 100) : null
  }

  const getMemberStatus = (member: StoreUser) => {
    if (!member.is_active) {
      if (member.email.toLowerCase().includes('diego')) {
        return 'SUSPENDED'
      }
      return 'INACTIVE'
    }
    return 'ACTIVE'
  }

  const getAvatarDotColor = (member: StoreUser) => {
    const status = getMemberStatus(member)
    if (status === 'ACTIVE') return 'bg-emerald-500'
    if (status === 'INACTIVE') return 'bg-amber-500'
    return 'bg-crehana-coral'
  }

  const renderStatusBadge = (member: StoreUser) => {
    const status = getMemberStatus(member)
    if (status === 'ACTIVE') {
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-500 border-emerald-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Activo
        </span>
      )
    } else if (status === 'INACTIVE') {
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-500 border-amber-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          Inactivo
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border bg-crehana-coral/10 text-crehana-coral border-crehana-coral/25">
          <span className="w-1.5 h-1.5 rounded-full bg-crehana-coral" />
          Suspendido
        </span>
      )
    }
  }

  let totalAssignments = 0
  let completedAssignments = 0
  members.forEach((m) => {
    totalAssignments += getMemberAssignedCount(m.id)
    paths.forEach((p) => {
      if (p.activities) {
        p.activities.forEach((a) => {
          if (a.assigned_to === m.id) {
            if (a.status === 'COMPLETED') {
              completedAssignments++
            }
          }
        })
      }
    })
  })
  const pendingAssignments = totalAssignments - completedAssignments
  const completedPercentage = totalAssignments ? Math.round((completedAssignments / totalAssignments) * 100) : 0

  let progressSum = 0
  let progressCount = 0
  members.forEach((m) => {
    const prog = getMemberCompletionProgress(m.id)
    if (prog !== null) {
      progressSum += prog
      progressCount++
    }
  })
  const averageProgress = progressCount ? Math.round(progressSum / progressCount) : 0

  const filteredMembers = members.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          member.email.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = roleFilter === 'ALL' || 
                        (roleFilter === 'MEMBER' && member.role.code === 'MEMBER') || 
                        (roleFilter === 'LEADER' && member.role.code === 'LEADER')
    
    const status = getMemberStatus(member)
    const matchesStatus = statusFilter === 'ALL' || 
                          (statusFilter === 'ACTIVE' && status === 'ACTIVE') || 
                          (statusFilter === 'INACTIVE' && status === 'INACTIVE') || 
                          (statusFilter === 'SUSPENDED' && status === 'SUSPENDED')

    return matchesSearch && matchesRole && matchesStatus
  })

  const sortedMembers = [...filteredMembers].sort((a, b) => {
    if (sortBy === 'NAME') {
      return a.name.localeCompare(b.name)
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  const totalPages = Math.ceil(sortedMembers.length / itemsPerPage)
  const paginatedMembers = sortedMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  if (isLoading && members.length === 0) {
    return (
      <div className="flex-1 p-8 overflow-y-auto w-full transition-colors duration-200 scrollbar-none bg-crehana-bg">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-48 animate-pulse"></div>
            <div className="h-4 bg-slate-100 dark:bg-slate-900 rounded-lg w-96 animate-pulse"></div>
          </div>
        </header>
        
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-crehana-panel border border-crehana-border flex items-center gap-5 shadow-sm animate-pulse h-24">
              <div className="p-4 rounded-xl bg-slate-200 dark:bg-slate-800 w-12 h-12"></div>
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded-lg w-20"></div>
                <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-lg w-8"></div>
              </div>
            </div>
          ))}
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-6 rounded-2xl bg-crehana-card border border-crehana-border/50 h-44 flex flex-col justify-between gap-6 animate-pulse"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-2xl shrink-0"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3"></div>
                  <div className="h-4 bg-slate-100 dark:bg-slate-900 rounded-lg w-1/3"></div>
                </div>
              </div>
              <div className="space-y-2 pt-2 border-t border-crehana-border/30">
                <div className="h-4 bg-slate-100 dark:bg-slate-900 rounded-lg w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto w-full transition-colors duration-200 scrollbar-none bg-[#0F111A]">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-crehana-text-muted hover:text-white mb-6 group cursor-pointer transition-colors"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Volver</span>
      </button>

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Equipo de Trabajo</h2>
          <p className="text-crehana-text-muted text-sm mt-1">
            Visualiza y administra los miembros del equipo, sus asignaciones y avance de cumplimiento.
          </p>
        </div>

        {isLeader && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-crehana-mora to-indigo-600 hover:from-indigo-600 hover:to-crehana-mora hover:shadow-[0_8px_25px_rgba(75,34,244,0.35)] text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-[0_4px_15px_rgba(75,34,244,0.15)] cursor-pointer hover-scale"
          >
            <UserPlus className="w-4 h-4" />
            <span>Registrar Miembro</span>
          </button>
        )}
      </header>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="p-6 rounded-2xl bg-[#161924] border border-crehana-border/40 flex items-center gap-5 shadow-sm hover:border-crehana-mora/40 transition-all duration-300">
          <div className="p-4 rounded-xl bg-crehana-mora/10 text-crehana-mora border border-crehana-mora/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-crehana-text-muted">Miembros Totales</p>
            <h3 className="text-2xl font-extrabold mt-1 text-white">{totalMembers}</h3>
            <p className="text-[10px] text-emerald-500 font-bold mt-0.5">3 nuevos este mes ↗</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#161924] border border-crehana-border/40 flex items-center gap-5 shadow-sm hover:border-indigo-500/40 transition-all duration-300">
          <div className="p-4 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-crehana-text-muted">Asignaciones Totales</p>
            <h3 className="text-2xl font-extrabold mt-1 text-white">{totalAssignments}</h3>
            <p className="text-[10px] text-amber-500 font-bold mt-0.5">{pendingAssignments} pendientes</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#161924] border border-crehana-border/40 flex items-center gap-5 shadow-sm hover:border-emerald-500/40 transition-all duration-300">
          <div className="p-4 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-crehana-text-muted">Completadas</p>
            <h3 className="text-2xl font-extrabold mt-1 text-white">{completedAssignments}</h3>
            <p className="text-[10px] text-emerald-500 font-bold mt-0.5">{completedPercentage}% del total</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-[#161924] border border-crehana-border/40 flex items-center gap-5 shadow-sm hover:border-crehana-mora/40 shadow-glow-mora transition-all duration-300">
          <div className="p-4 rounded-xl bg-crehana-mora/10 text-crehana-mora border border-crehana-mora/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-crehana-text-muted">Progreso Promedio</p>
            <h3 className="text-2xl font-extrabold mt-1 text-white">{averageProgress}%</h3>
            <p className="text-[10px] text-emerald-500 font-bold mt-0.5">+8% vs mes anterior ↗</p>
          </div>
        </div>
      </section>

      <section className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 bg-[#161924] p-4 rounded-2xl border border-crehana-border/40">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full xl:w-auto">
          <div className="relative flex items-center bg-[#0F111A] border border-crehana-border/60 rounded-xl px-3 py-2 focus-within:border-crehana-mora transition-colors w-full md:w-80">
            <Search className="w-4 h-4 text-crehana-text-muted mr-2 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Buscar miembro por nombre o correo..."
              className="bg-transparent border-none text-xs text-white outline-none placeholder-crehana-text-muted w-full"
            />
          </div>

          <div className="flex bg-[#0F111A] rounded-xl p-1 border border-crehana-border/50 select-none">
            <button
              onClick={() => { setRoleFilter('ALL'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                roleFilter === 'ALL' ? 'bg-[#292257] text-white' : 'text-crehana-text-muted hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => { setRoleFilter('MEMBER'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                roleFilter === 'MEMBER' ? 'bg-[#292257] text-white' : 'text-crehana-text-muted hover:text-white'
              }`}
            >
              Miembros
            </button>
            <button
              onClick={() => { setRoleFilter('LEADER'); setCurrentPage(1); }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                roleFilter === 'LEADER' ? 'bg-[#292257] text-white' : 'text-crehana-text-muted hover:text-white'
              }`}
            >
              Administradores
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-4 select-none">
            <button
              onClick={() => { setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE'); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors ${
                statusFilter === 'ACTIVE' ? 'text-emerald-500' : 'text-crehana-text-muted hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Activos</span>
            </button>
            <button
              onClick={() => { setStatusFilter(statusFilter === 'INACTIVE' ? 'ALL' : 'INACTIVE'); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors ${
                statusFilter === 'INACTIVE' ? 'text-amber-500' : 'text-crehana-text-muted hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Inactivos</span>
            </button>
            <button
              onClick={() => { setStatusFilter(statusFilter === 'SUSPENDED' ? 'ALL' : 'SUSPENDED'); setCurrentPage(1); }}
              className={`flex items-center gap-1.5 text-xs font-bold cursor-pointer transition-colors ${
                statusFilter === 'SUSPENDED' ? 'text-crehana-coral' : 'text-crehana-text-muted hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-crehana-coral" />
              <span>Suspendidos</span>
            </button>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'RECENT' | 'NAME')}
            className="bg-[#0F111A] border border-crehana-border/50 text-white text-xs font-bold rounded-xl px-4 py-2 outline-none focus:border-crehana-mora appearance-none cursor-pointer pr-8 relative min-w-[130px]"
          >
            <option value="RECENT">Más recientes</option>
            <option value="NAME">Por nombre</option>
          </select>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {paginatedMembers.map((member) => {
          const assignedCount = getMemberAssignedCount(member.id)
          const progress = getMemberCompletionProgress(member.id)
          const isMemberLeader = member.role.code === 'LEADER'

          return (
            <div
              key={member.id}
              className={`p-6 rounded-2xl bg-[#161924] border border-crehana-border/30 hover:border-crehana-mora/40 transition-all duration-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative group ${
                !member.is_active ? 'opacity-65' : ''
              }`}
            >
              <div className="flex items-center gap-3.5 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-full bg-[#292257] text-[#A78BFA] flex items-center justify-center text-sm font-bold shrink-0 relative border border-crehana-mora/20">
                  {member.name.substring(0, 2).toUpperCase()}
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#161924] ${getAvatarDotColor(member)}`} />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-white text-base truncate leading-snug">
                    {member.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span
                      className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        isMemberLeader
                          ? 'bg-crehana-mora/15 text-crehana-mora border-crehana-mora/20'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}
                    >
                      {isMemberLeader ? 'Administrador' : 'Miembro'}
                    </span>
                    {renderStatusBadge(member)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-crehana-text-muted mt-2.5 truncate max-w-[200px]">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>
              </div>

              {!isMemberLeader && member.is_active && (
                <div className="flex items-center gap-6 shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-crehana-border/20 w-full md:w-auto">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-crehana-text-muted shrink-0" />
                    <div>
                      <p className="text-[9px] text-crehana-text-muted font-bold uppercase tracking-wider">Asignadas</p>
                      <h5 className="font-extrabold text-sm text-white">{assignedCount}</h5>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-crehana-text-muted font-bold uppercase tracking-wider">Progreso</span>
                    <div className="flex items-center gap-2">
                      <h5 className="font-extrabold text-sm text-white shrink-0">
                        {progress !== null ? `${progress}%` : 'N/A'}
                      </h5>
                      {progress !== null && (
                        <div className="w-20 bg-[#0F111A] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {isLeader && (
                <div className="flex md:flex-col items-center gap-2 shrink-0 self-stretch justify-end md:justify-center border-t md:border-t-0 border-crehana-border/20 pt-4 md:pt-0 w-full md:w-auto">
                  <button
                    onClick={() => setSelectedMember(member)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-crehana-border/40 hover:border-white text-xs font-bold text-crehana-text-muted hover:text-white transition-all cursor-pointer w-24 justify-center"
                  >
                    <User className="w-3 h-3" />
                    <span>Ver perfil</span>
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-crehana-border/40 hover:border-white text-xs font-bold text-crehana-text-muted hover:text-white transition-all cursor-pointer w-24 justify-center"
                  >
                    <Clipboard className="w-3 h-3" />
                    <span>Asignar</span>
                  </button>
                  <button
                    onClick={() => setSelectedMember(member)}
                    className="p-2 rounded-xl text-crehana-text-muted hover:text-white hover:bg-crehana-border/25 transition-all cursor-pointer hidden md:block"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {sortedMembers.length === 0 && (
          <div className="col-span-full py-20 text-center flex flex-col items-center justify-center p-6 bg-[#161924] border border-crehana-border/40 rounded-2xl">
            <div className="w-16 h-16 rounded-2xl bg-[#0F111A] flex items-center justify-center text-crehana-text-muted mb-4">
              <Users className="w-8 h-8" />
            </div>
            <h5 className="font-semibold text-lg mb-1 text-white">No se encontraron miembros</h5>
            <p className="text-sm text-crehana-text-muted max-w-sm">
              Prueba modificando los filtros o realizando otra búsqueda.
            </p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-4 border-t border-crehana-border/20">
          <span className="text-xs text-crehana-text-muted">
            Mostrando {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, sortedMembers.length)} de {sortedMembers.length} miembros
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="p-1.5 rounded-lg border border-crehana-border/40 text-crehana-text-muted hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPage === page
                    ? 'bg-crehana-mora text-white shadow-[0_2px_10px_rgba(75,34,244,0.3)]'
                    : 'border border-crehana-border/40 text-crehana-text-muted hover:text-white'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="p-1.5 rounded-lg border border-crehana-border/40 text-crehana-text-muted hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="bg-[#0F111A] border border-crehana-border/50 text-crehana-text-muted text-xs font-bold rounded-xl px-4 py-2 outline-none focus:border-crehana-mora appearance-none cursor-pointer pr-8 relative"
          >
            <option value={8}>8 por página</option>
            <option value={16}>16 por página</option>
            <option value={24}>24 por página</option>
          </select>
        </div>
      )}

      {isModalOpen && <ProvisionMemberModal onClose={() => setIsModalOpen(false)} />}
      {selectedMember && (
        <ManageMemberModal member={selectedMember} onClose={() => setSelectedMember(null)} />
      )}
    </div>
  )
}
