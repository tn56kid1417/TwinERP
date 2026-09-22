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
 'bg-white border border-slate-200 rounded-lg shadow-lg shadow-slate-200/50 dark:shadow-black/40 transition-all duration-300',
 hoverEffect && 'hover:shadow-lg hover:shadow-blue-600/10 hover:border-blue-200 dark:hover:border-slate-700/80',
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
 <div className={cn('px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4 transition-colors', className)} {...props}>
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
 <h3 className={cn('text-base font-bold text-slate-800 tracking-tight', className)} {...props}>
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
 <div className={cn('px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-end gap-2 rounded-b-2xl transition-colors', className)} {...props}>
 {children}
 </div>
 )
}
export default Card
