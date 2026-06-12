import React, { useState } from 'react'
import { useAuthStore } from '../store/auth.store'
import { useThemeStore } from '../store/theme.store'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  LogOut, Folder, Shield, User as UserIcon, Sun, Moon, 
  ChevronLeft, ChevronRight, BarChart2, Users, BookOpen
} from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const [isCollapsed, setIsCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  )
  const navigate = useNavigate()
  const location = useLocation()

  const handleToggleCollapse = () => {
    const nextState = !isCollapsed
    setIsCollapsed(nextState)
    localStorage.setItem('sidebar-collapsed', String(nextState))
  }

  const isLeader = user?.role.code === 'LEADER'

  return (
    <div className="min-h-screen w-full flex bg-crehana-bg text-crehana-text transition-colors duration-200 overflow-hidden font-sans">
      <aside 
        className={`border-r border-crehana-border/55 bg-crehana-bg flex flex-col justify-between p-5 shrink-0 transition-all duration-300 relative z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3 px-2 py-1">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-crehana-mora flex items-center justify-center text-white text-sm shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              {!isCollapsed && (
                <span className="text-xl font-bold tracking-tight text-crehana-text">
                  LearnFlow
                </span>
              )}
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => navigate('/')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors relative overflow-hidden group cursor-pointer ${
                location.pathname === '/' || location.pathname.startsWith('/paths')
                  ? 'bg-crehana-mora/10 text-crehana-mora border border-crehana-mora/20'
                  : 'text-crehana-text-muted hover:bg-crehana-card/40 hover:text-crehana-text border border-transparent'
              } ${isCollapsed ? 'justify-center p-3' : ''}`}
            >
              {!isCollapsed && (location.pathname === '/' || location.pathname.startsWith('/paths')) && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-crehana-mora rounded-r-md" />
              )}
              <Folder className="w-4.5 h-4.5 shrink-0 group-hover:scale-110 transition-transform" />
              {!isCollapsed && <span>Rutas de Aprendizaje</span>}
            </button>

            <button
              onClick={() => navigate('/statistics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors relative overflow-hidden group cursor-pointer ${
                location.pathname === '/statistics'
                  ? 'bg-crehana-mora/10 text-crehana-mora border border-crehana-mora/20'
                  : 'text-crehana-text-muted hover:bg-crehana-card/40 hover:text-crehana-text border border-transparent'
              } ${isCollapsed ? 'justify-center p-3' : ''}`}
            >
              {!isCollapsed && location.pathname === '/statistics' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-crehana-mora rounded-r-md" />
              )}
              <BarChart2 className="w-4.5 h-4.5 shrink-0 group-hover:scale-110 transition-transform" />
              {!isCollapsed && <span>Estadísticas</span>}
            </button>

            <button
              onClick={() => navigate('/team')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-sm transition-colors relative overflow-hidden group cursor-pointer ${
                location.pathname === '/team'
                  ? 'bg-crehana-mora/10 text-crehana-mora border border-crehana-mora/20'
                  : 'text-crehana-text-muted hover:bg-crehana-card/40 hover:text-crehana-text border border-transparent'
              } ${isCollapsed ? 'justify-center p-3' : ''}`}
            >
              {!isCollapsed && location.pathname === '/team' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-crehana-mora rounded-r-md" />
              )}
              <Users className="w-4.5 h-4.5 shrink-0 group-hover:scale-110 transition-transform" />
              {!isCollapsed && <span>Equipo</span>}
            </button>
          </nav>
        </div>

        <div />
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 px-8 border-b border-crehana-border bg-crehana-bg flex items-center justify-between shrink-0 z-20">
          <button
            onClick={handleToggleCollapse}
            className="p-2 rounded-xl text-crehana-text-muted hover:text-crehana-text hover:bg-crehana-card border border-transparent hover:border-crehana-border/25 cursor-pointer transition-all flex items-center justify-center hover-scale"
            title={isCollapsed ? 'Expandir barra' : 'Contraer barra'}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-crehana-text-muted hover:text-crehana-text hover:bg-crehana-card border border-transparent hover:border-crehana-border/25 cursor-pointer transition-all flex items-center justify-center hover-scale"
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-500" />
              ) : (
                <Moon className="w-5 h-5 text-crehana-mora" />
              )}
            </button>

            <div className="w-px h-6 bg-crehana-border/50" />

            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-crehana-panel/40 border border-crehana-border/40 select-none">
              <div className={`p-1.5 rounded-lg shrink-0 ${
                isLeader 
                  ? 'bg-crehana-coral/10 text-crehana-coral border border-crehana-coral/15' 
                  : 'bg-crehana-menta/10 text-crehana-menta border border-crehana-menta/15'
              }`}>
                {isLeader ? <Shield className="w-4.5 h-4.5" /> : <UserIcon className="w-4.5 h-4.5" />}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-crehana-text leading-tight">{user?.name}</p>
                <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                  isLeader 
                    ? 'bg-crehana-coral/10 text-crehana-coral border border-crehana-coral/20' 
                    : 'bg-crehana-menta/10 text-crehana-menta border border-crehana-menta/20'
                }`}>
                  {isLeader ? 'Líder L&D' : 'Miembro'}
                </span>
              </div>
            </div>

            <div className="w-px h-6 bg-crehana-border/50" />

            <button
              onClick={logout}
              className="p-2 rounded-xl text-crehana-coral hover:bg-crehana-coral/10 border border-transparent hover:border-crehana-coral/20 cursor-pointer transition-all flex items-center justify-center hover-scale group"
              title="Cerrar sesión"
            >
              <LogOut className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </header>

        {children}
      </div>
    </div>
  )
}

