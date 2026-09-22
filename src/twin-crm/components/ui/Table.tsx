import React from 'react'
import { cn } from '../../utils/cn'

export interface Column<T> {
 header: string
 accessor: keyof T | ((row: T) => React.ReactNode)
 className?: string
}

export interface TableProps<T> {
 columns: Column<T>[]
 data: T[]
 isLoading?: boolean
 emptyMessage?: string
 rowClick?: (row: T) => void
}

export function Table<T extends { id: string | number }>({
 columns,
 data,
 isLoading = false,
 emptyMessage = 'No records found.',
 rowClick,
}: TableProps<T>) {
 return (
 <div className="w-full overflow-hidden border border-slate-200 rounded-lg bg-white shadow-sm transition-all">
 <div className="w-full overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-slate-100 bg-slate-50 transition-colors">
 {columns.map((col, idx) => (
 <th
 key={idx}
 className={cn(
 'p-4 text-xs font-bold text-slate-500',
 col.className
 )}
 >
 {col.header}
 </th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
 {isLoading ? (
 <tr>
 <td colSpan={columns.length} className="p-8 text-center">
 <div className="flex flex-col items-center justify-center gap-2">
 <svg
 className="animate-spin h-6 w-6 text-primary"
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
 <span className="text-sm font-medium text-slate-500">Fetching records...</span>
 </div>
 </td>
 </tr>
 ) : data.length === 0 ? (
 <tr>
 <td colSpan={columns.length} className="p-12 text-center">
 <span className="text-sm font-medium text-slate-500">{emptyMessage}</span>
 </td>
 </tr>
 ) : (
 data.map((row) => (
 <tr
 key={row.id}
 onClick={() => rowClick && rowClick(row)}
 className={cn(
 'transition-colors hover:bg-blue-50/40',
 rowClick && 'cursor-pointer'
 )}
 >
 {columns.map((col, colIdx) => (
 <td
 key={colIdx}
 className={cn(
 'p-4 text-sm text-slate-700 font-medium',
 col.className
 )}
 >
 {typeof col.accessor === 'function'
 ? col.accessor(row)
 : (row[col.accessor] as React.ReactNode)}
 </td>
 ))}
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 )
}
export default Table
