import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Link2 as LinkIcon, Hash, Tag } from 'lucide-react';

export interface JobField {
  id: string;
  label: string;
  value: string;
  fieldType: string;
  section: string;
  order: number;
}

export function JobFieldValue({ field }: { field: JobField }) {
  const { label, value, fieldType } = field;

  if (fieldType === 'TAG') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-[11px] font-mono tracking-[0.15em] uppercase text-gray-500">{label}:</span>
        <Badge className="rounded-full text-xs gap-1 bg-[#0099d6]/10 text-[#0099d6] border-[#0099d6]/20 hover:bg-[#0099d6]/15">
          <Tag className="h-3 w-3" /> {value}
        </Badge>
      </div>
    );
  }

  if (fieldType === 'LINK') {
    const isValid = (() => { try { new URL(value); return true; } catch { return false; } })();
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-[11px] font-mono tracking-[0.15em] uppercase text-gray-500">{label}:</span>
        {isValid ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-[#0099d6] hover:text-[#082654] hover:underline underline-offset-2">
            <LinkIcon className="h-3 w-3" /> {value}
          </a>
        ) : (
          <span className="text-sm text-gray-800 dark:text-gray-200">{value}</span>
        )}
      </div>
    );
  }

  if (fieldType === 'DATE') {
    const d = (() => { try { return new Date(value).toLocaleDateString(); } catch { return value; } })();
    return (
      <div className="flex items-center gap-2 text-sm">
        <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-[11px] font-mono tracking-[0.15em] uppercase text-gray-500">{label}:</span>
        <span className="text-sm text-gray-800 dark:text-gray-200">{d}</span>
      </div>
    );
  }

  if (fieldType === 'NUMBER') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Hash className="h-3.5 w-3.5 text-gray-400" />
        <span className="text-[11px] font-mono tracking-[0.15em] uppercase text-gray-500">{label}:</span>
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 tabular-nums">{value}</span>
      </div>
    );
  }

  // TEXT / TEXTAREA default
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 text-sm">
      <span className="text-[11px] font-mono tracking-[0.15em] uppercase text-gray-500 shrink-0">{label}</span>
      <span className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{value}</span>
    </div>
  );
}
