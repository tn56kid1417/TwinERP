import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Separator({ className, orientation = 'horizontal' }: { className?: string; orientation?: 'horizontal' | 'vertical' }) {
 return (
 <div
 role="none"
 className={twMerge(
 clsx(
 "shrink-0 bg-gray-200 dark:bg-gray-800",
 orientation === 'horizontal' ? "h-[1px] w-full my-4": "h-full w-[1px] mx-4",
 className
 )
 )}
 />
 );
}
