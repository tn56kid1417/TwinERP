import React from 'react'
import { cn } from '../../utils/cn'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info'
  outline?: boolean
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'primary',
  outline = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider'
  
  const variants = {
    primary: outline 
      ? 'border border-primary text-primary bg-transparent' 
      : 'bg-primary/10 text-primary border border-primary/20',
    secondary: outline 
      ? 'border border-secondary-foreground/30 text-secondary-foreground bg-transparent' 
      : 'bg-secondary text-secondary-foreground border border-border',
    success: outline 
      ? 'border border-success text-success bg-transparent' 
      : 'bg-success/15 text-success border border-success/20',
    warning: outline 
      ? 'border border-warning text-warning bg-transparent' 
      : 'bg-warning/15 text-warning border border-warning/20',
    danger: outline 
      ? 'border border-danger text-danger bg-transparent' 
      : 'bg-danger/15 text-danger border border-danger/20',
    info: outline 
      ? 'border border-info text-info bg-transparent' 
      : 'bg-info/15 text-info border border-info/20',
  }

  return (
    <span
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </span>
  )
}
export default Badge
