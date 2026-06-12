import React, { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown, UserMinus, X } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  is_active?: boolean
  role: {
    code: string
    name: string
  }
}

interface MemberAssigneeSelectProps {
  assignedTo: string | null
  members: User[]
  onAssign: (userId: string) => Promise<void>
  onUnassign: () => Promise<void>
}

export const MemberAssigneeSelect: React.FC<MemberAssigneeSelectProps> = ({
  assignedTo,
  members,
  onAssign,
  onUnassign,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const assignedMember = members.find((m) => m.id === assignedTo)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const filteredMembers = members.filter((member) =>
    member.is_active !== false &&
    member.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectMember = async (userId: string) => {
    await onAssign(userId)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleUnassign = async () => {
    await onUnassign()
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div className="flex items-center bg-slate-100 dark:bg-slate-800 border border-crehana-border rounded-lg text-xs font-semibold text-crehana-text min-w-[140px] max-w-[160px] overflow-hidden">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-left flex-1 min-w-0"
        >
          <div className="w-5 h-5 rounded-full bg-crehana-mora/10 text-crehana-mora flex items-center justify-center text-[9px] font-bold border border-crehana-mora/15 shrink-0">
            {assignedMember ? assignedMember.name.substring(0, 2).toUpperCase() : '?'}
          </div>
          <span className="truncate">{assignedMember ? assignedMember.name : 'Sin asignar'}</span>
        </button>

        {assignedTo ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleUnassign()
            }}
            className="p-1.5 hover:bg-crehana-coral/10 hover:text-crehana-coral text-crehana-text-muted transition-colors cursor-pointer shrink-0 border-l border-crehana-border/30"
            title="Retirar miembro"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-crehana-text-muted transition-colors cursor-pointer shrink-0 border-l border-crehana-border/30"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-64 bg-crehana-card border border-crehana-border rounded-xl shadow-xl z-50 p-2 space-y-2">
          <div className="relative flex items-center bg-slate-50 dark:bg-slate-900 border border-crehana-border/80 rounded-lg px-2 py-1.5 focus-within:border-crehana-mora transition-colors">
            <Search className="w-3.5 h-3.5 text-crehana-text-muted mr-1.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar miembro..."
              className="w-full bg-transparent border-none text-xs text-crehana-text outline-none placeholder-crehana-text-muted/65"
              autoFocus
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5 scrollbar-none">
            {assignedTo && (
              <button
                type="button"
                onClick={handleUnassign}
                className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-crehana-coral hover:bg-crehana-coral/10 rounded-lg cursor-pointer transition-colors text-left"
              >
                <UserMinus className="w-3.5 h-3.5 shrink-0" />
                <span>Retirar miembro (Sin asignar)</span>
              </button>
            )}

            {filteredMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => handleSelectMember(member.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition-colors text-left ${
                  member.id === assignedTo
                    ? 'bg-crehana-mora/10 text-crehana-mora font-bold'
                    : 'text-crehana-text hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="w-5 h-5 rounded-full bg-crehana-mora/10 text-crehana-mora flex items-center justify-center text-[9px] font-bold border border-crehana-mora/15 shrink-0">
                    {member.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="truncate">{member.name}</span>
                </div>
                {member.id === assignedTo && (
                  <span className="text-[10px] text-crehana-mora">✓</span>
                )}
              </button>
            ))}

            {filteredMembers.length === 0 && (
              <div className="py-4 text-center text-xs text-crehana-text-muted italic">
                No se encontraron miembros
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
