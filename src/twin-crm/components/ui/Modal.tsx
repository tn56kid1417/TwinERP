import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { Button } from './Button'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={cn(
          'relative w-full bg-white/95 dark:bg-[#0C1017]/95 backdrop-blur-2xl text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-slate-700/50 rounded-2xl shadow-2xl shadow-slate-900/15 dark:shadow-black/80 ring-1 ring-black/5 dark:ring-white/10 overflow-hidden z-10 animate-slide-up',
          sizeClasses[size]
        )}
      >
        {/* Subtle top accent gradient */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/80 to-transparent pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/50 backdrop-blur-md">
          <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-indigo-500/50"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[78vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
export default Modal
