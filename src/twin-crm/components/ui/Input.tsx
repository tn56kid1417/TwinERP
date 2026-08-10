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
          <label className="text-xs font-semibold uppercase tracking-wider text-foreground/75">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-foreground/45 flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          
          <input
            type={type}
            ref={ref}
            className={cn(
              'w-full text-sm py-2 px-3.5 bg-card border border-border text-foreground rounded-lg transition-all duration-200 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-foreground/40 disabled:opacity-50 disabled:bg-secondary/40',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              error && 'border-danger focus:border-danger focus:ring-danger/20',
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 text-foreground/45 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <span className="text-xs text-danger font-medium animate-fade-in">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-foreground/50">{helperText}</span>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
