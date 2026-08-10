import React from 'react'
import { Outlet } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'

export const AuthLayout: React.FC = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 overflow-hidden p-4">
      {/* Decorative background shapes */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-50" style={{ animationDelay: '2s' }} />
      
      {/* Auth Panel Grid */}
      <div className="w-full max-w-md z-10">
        
        {/* Branding header in Login Panel */}
        <div className="flex flex-col items-center justify-center mb-8 gap-2">
          <div className="p-4 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
            <BarChart3 size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 mt-2">
            CRM Portal
          </h1>
        </div>

        {/* Dynamic page container */}
        <Outlet />
      </div>
    </div>
  )
}
export default AuthLayout
