import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
 size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
 ({ className, variant = 'default', size = 'default', ...props }, ref) => {
 const base = "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 cursor-pointer";
 const variants = {
 default: "bg-blue-600 text-white hover:bg-blue-700 shadow-sm",
 destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
 outline: "border border-gray-200 bg-transparent hover:bg-gray-100 dark:border-gray-800 text-inherit",
 secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-100",
 ghost: "hover:bg-gray-100 text-inherit",
 link: "text-blue-600 underline-offset-4 hover:underline",
 };
 const sizes = {
 default: "h-9 px-4 py-2 text-sm rounded-md",
 sm: "h-8 rounded-md px-3 text-xs",
 lg: "h-11 rounded-md px-8 text-base",
 icon: "h-9 w-9 rounded-md",
 };
 return (
 <button
 ref={ref}
 className={twMerge(clsx(base, variants[variant], sizes[size], className))}
 {...props}
 />
 );
 }
);
Button.displayName = 'Button';
