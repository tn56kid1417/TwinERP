import React from 'react'
import { cn } from '../../utils/cn'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
 size?: 'sm' | 'md' | 'lg'
 isLoading?: boolean
 fullWidth?: boolean
}

export const Button: React.FC<ButtonProps> = ({
 children,
 className,
 variant = 'primary',
 size = 'md',
 isLoading = false,
 fullWidth = false,
 disabled,
 ...props
}) => {
 const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer'
 
 const variants = {
 primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm focus:ring-blue-500/20',
 secondary: 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200 shadow-sm',
 outline: 'border border-slate-200 bg-white/80 dark:bg-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm',
 danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm ',
 ghost: 'bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100',
 }

 const sizes = {
 sm: 'px-3 py-1.5 text-xs',
 md: 'px-4 py-2 text-sm',
 lg: 'px-6 py-3 text-base',
 }

 return (
 <button
 className={cn(
 baseStyles,
 variants[variant],
 sizes[size],
 fullWidth && 'w-full',
 className
 )}
 disabled={disabled || isLoading}
 {...props}
 >
 {isLoading ? (
 <>
 <svg
 className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
 xmlns="http://www.w3.org/2000/svg"
 fill="none"
 viewBox="0 0 24 24"
 >
 <circle
 className="opacity-25"
 cx="12"
 cy="12"
 r="10"
 stroke="currentColor"
 strokeWidth="4"
 />
 <path
 className="opacity-75"
 fill="currentColor"
 d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
 />
 </svg>
 Loading...
 </>
 ) : (
 children
 )}
 </button>
 )
}
export default Button
