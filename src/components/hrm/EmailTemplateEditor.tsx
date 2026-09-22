import React, { useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface EmailTemplateEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  availableTags: { tag: string; label: string }[];
  placeholder?: string;
}

export function EmailTemplateEditor({
  label,
  value,
  onChange,
  availableTags,
  placeholder = "Leave blank to use the standard default template.",
}: EmailTemplateEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertTag = (tag: string) => {
    const tagText = `{{${tag}}}`;
    const el = textareaRef.current;
    if (!el) {
      onChange(value ? `${value}${tagText}` : tagText);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const next = `${before}${tagText}${after}`;
    onChange(next);
    // restore cursor after inserted tag
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + tagText.length;
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs gap-1 border-slate-200 dark:border-slate-700">
              Insert variable <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[260px] overflow-y-auto w-72">
            {availableTags.map((t) => (
              <DropdownMenuItem key={t.tag} onClick={() => insertTag(t.tag)} className="text-xs cursor-pointer py-1.5">
                {t.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[110px] text-xs font-mono bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
        rows={4}
      />
      <p className="text-[11px] text-slate-400">Leave blank to use the system default wording.</p>
    </div>
  );
}
