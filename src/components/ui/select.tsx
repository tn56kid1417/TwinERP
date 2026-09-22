import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronDown, Check } from 'lucide-react';

interface SelectContextType {
  value: string;
  onValueChange: (val: string) => void;
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  labels: Record<string, string>;
  registerLabel: (val: string, label: string) => void;
}
const SelectContext = createContext<SelectContextType | null>(null);

export function Select({ value, onValueChange, children }: { value: string; onValueChange: (v: string) => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const registerLabel = (val: string, label: string) => {
    setLabels(prev => prev[val] === label ? prev : { ...prev, [val]: label });
  };
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOut = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOut);
    return () => document.removeEventListener('mousedown', handleOut);
  }, []);

  return (
    <SelectContext.Provider value={{ value, onValueChange, open, setOpen, labels, registerLabel }}>
      <div ref={ref} className="relative inline-block w-full">
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => ctx?.setOpen(o => !o)}
      className={twMerge(
        clsx(
          "flex h-9 w-full items-center justify-between rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-gray-900 dark:text-gray-100",
          className
        )
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50 ml-2 shrink-0" />
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = useContext(SelectContext);
  const display = (ctx && ctx.value && ctx.labels[ctx.value]) || ctx?.value || placeholder || '';
  return <span className={clsx("block truncate text-left", !ctx?.value && "text-gray-400")}>{display}</span>;
}

export function SelectContent({ children, className }: { children: React.ReactNode; className?: string }) {
  const ctx = useContext(SelectContext);
  if (!ctx?.open) return null;
  return (
    <div className={twMerge(clsx("absolute z-50 min-w-[8rem] w-full mt-1 overflow-auto rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1f2c] p-1 text-gray-900 dark:text-gray-100 shadow-lg max-h-60", className))}>
      {children}
    </div>
  );
}

export function SelectItem({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const ctx = useContext(SelectContext);
  useEffect(() => {
    if (typeof children === 'string') {
      ctx?.registerLabel(value, children);
    }
  }, [value, children]);

  const isSelected = ctx?.value === value;
  return (
    <div
      onClick={() => {
        ctx?.onValueChange(value);
        ctx?.setOpen(false);
      }}
      className={twMerge(
        clsx(
          "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors",
          isSelected && "font-semibold bg-gray-50 dark:bg-gray-800/60",
          className
        )
      )}
    >
      <span className="truncate">{children}</span>
      {isSelected && (
        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
          <Check className="h-4 w-4 text-indigo-600" />
        </span>
      )}
    </div>
  );
}
