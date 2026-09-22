import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LogOut, ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { SIDEBAR_NAV } from '../constants/navigation'
import { Badge } from './ui/Badge'
import { cn } from '../utils/cn'

export const Sidebar: React.FC = () => {
 const [isCollapsed, setIsCollapsed] = useState(false)
 const { user, logout } = useAuthStore()
 const location = useLocation()

 if (!user) return null

 // Filter navigation items by user role
 const filteredNav = SIDEBAR_NAV.filter(
 (item) => !item.allowedRoles || item.allowedRoles.includes(user.role)
 )

 const roleLabel = user.role.replace('_', ' ');

 return (
 <aside
 className={cn(
 'relative flex flex-col h-screen border-r border-slate-200 bg-white/60 transition-all duration-300 z-30',
 isCollapsed ? 'w-20' : 'w-64'
 )}
 >
 {/* Brand Header */}
 <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50 h-16 transition-colors">
 <div className="flex items-center gap-3 overflow-hidden">
 <div className="p-2 bg-primary text-primary-foreground rounded-xl flex items-center justify-center flex-shrink-0">
 <BarChart3 size={20} />
 </div>
 {!isCollapsed && (
 <span className="font-extrabold text-base tracking-tight text-slate-900 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent truncate">
 Twincord
 </span>
 )}
 </div>
 </div>

 {/* Collapse Toggle Button */}
 <button
 onClick={() => setIsCollapsed(!isCollapsed)}
 className="absolute -right-3 top-18 p-1 bg-white text-slate-600 border border-slate-200 rounded-full hover:bg-slate-50 cursor-pointer shadow-sm z-40 hidden md:block"
 >
 {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
 </button>

 {/* Nav List */}
 <nav className="flex-1 min-h-0 p-4 pb-36 space-y-1.5 overflow-y-auto">
 {filteredNav.map((item) => {
 const isActive = location.pathname === item.href || location.pathname.startsWith(item.href + '/')
 const Icon = item.icon

 return (
 <Link
 key={item.href}
 to={item.href}
 className={cn(
 'flex items-center gap-3.5 px-3.5 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 group relative',
 isActive
 ? 'bg-primary text-primary-foreground shadow-sm hover:shadow-md'
 : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
 )}
 >
 <Icon size={18} className={cn('flex-shrink-0 transition-transform ', isActive ? 'text-current' : 'text-slate-400 group-hover:text-slate-600')} />
 {!isCollapsed && <span className="truncate">{item.name}</span>}
 
 {/* Tooltip for collapsed mode */}
 {isCollapsed && (
 <div className="absolute left-full ml-4 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity whitespace-nowrap z-50">
 {item.name}
 </div>
 )}
 </Link>
 )
 })}
 </nav>

 {/* Profile Section & Logout */}
 <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-slate-50/95/95 space-y-3 transition-colors">
 <div className={cn('flex items-center gap-3', isCollapsed ? 'justify-center' : 'justify-start')}>
 {/* Avatar Icon */}
 <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0 uppercase border border-primary/20">
 {user.name.charAt(0)}
 </div>
 {!isCollapsed && (
 <div className="flex-1 min-w-0">
 <p className="text-sm font-bold text-slate-900 leading-tight truncate">{user.name}</p>
 <div className="flex items-center gap-1.5 mt-0.5">
 <Badge variant={user.role === 'COMPANY_ADMIN' ? 'primary' : 'success'} className="px-1.5 py-0 text-[9px] font-bold">
 {roleLabel}
 </Badge>
 </div>
 </div>
 )}
 </div>

 <button
 onClick={logout}
 className={cn(
 'flex items-center gap-3.5 w-full px-3.5 py-2.5 text-sm font-semibold text-danger/80 hover:bg-danger/10 hover:text-danger rounded-md transition-all duration-200 group relative cursor-pointer',
 isCollapsed && 'justify-center'
 )}
 >
 <LogOut size={18} className="flex-shrink-0 group-hover:-translate-x-0.5 transition-transform"/>
 {!isCollapsed && <span>Log out</span>}

 {isCollapsed && (
 <div className="absolute left-full ml-4 px-2 py-1 bg-danger text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity whitespace-nowrap z-50">
 Log out
 </div>
 )}
 </button>
 </div>
 </aside>
 )
}
export default Sidebar
