import React from 'react'
import { cn } from '../../utils/cn'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean
  hoverEffect?: boolean
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  glass = true,
  hoverEffect = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-[#0C1017]/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-xl shadow-black/40 transition-all duration-300',
        hoverEffect && 'hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-slate-700/80',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('px-6 py-4 border-b border-slate-800/80 flex items-center justify-between gap-4 transition-colors', className)} {...props}>
      {children}
    </div>
  )
}

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <h3 className={cn('text-base font-semibold text-slate-100', className)} {...props}>
      {children}
    </h3>
  )
}

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  )
}

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('px-6 py-4 border-t border-slate-800/80 bg-[#07090E]/60 flex items-center justify-end gap-2 rounded-b-2xl transition-colors', className)} {...props}>
      {children}
    </div>
  )
}
export default Card
