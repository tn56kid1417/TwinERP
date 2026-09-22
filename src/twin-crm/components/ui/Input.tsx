import React, { forwardRef } from 'react'
import { cn } from '../../utils/cn'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
 label?: string
 error?: string
 helperText?: string
 leftIcon?: React.ReactNode
 rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
 ({ className, type = 'text', label, error, helperText, leftIcon, rightIcon, ...props }, ref) => {
 return (
 <div className="w-full flex flex-col gap-1.5 text-left">
 {label && (
 <label className="text-xs font-medium text-slate-600">
 {label}
 </label>
 )}
 <div className="relative flex items-center">
 {leftIcon && (
 <div className="absolute left-3.5 text-slate-400 flex items-center justify-center pointer-events-none">
 {leftIcon}
 </div>
 )}
 
 <input
 type={type}
 ref={ref}
 className={cn(
 'w-full text-sm py-2.5 px-3.5 bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400 rounded-md transition-all duration-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-[#05070A] shadow-sm disabled:opacity-50 disabled:bg-slate-100 dark:disabled:bg-slate-900/40',
 leftIcon && 'pl-10',
 rightIcon && 'pr-10',
 error && 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/25',
 className
 )}
 {...props}
 />

 {rightIcon && (
 <div className="absolute right-3.5 text-slate-400 flex items-center justify-center pointer-events-none">
 {rightIcon}
 </div>
 )}
 </div>

 {error ? (
 <span className="text-xs text-rose-400 font-medium animate-fade-in">
 {typeof error === 'string' ? error : (error as any)?.message || String(error)}
 </span>
 ) : helperText ? (
 <span className="text-xs text-slate-400">{helperText}</span>
 ) : null}
 </div>
 )
 }
)

Input.displayName = 'Input'
export default Input
