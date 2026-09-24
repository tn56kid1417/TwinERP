import React from 'react';
import { MapPin, Clock, Briefcase, CalendarDays, Link as LinkIcon, Hash, Tag } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function JobFieldValue({ field }: { field: any }) {
  const { fieldType, label, value } = field;

  if (fieldType === 'TAG') {
    return (
      <div className="flex gap-2 text-sm">
        <label className="text-[11px] font-mono tracking-[0.15em] uppercase text-[#0826547a]">{label}</label>
        <Badge className="rounded-full bg-[#0099d6]/10 text-[#0099d6] border-[#0099d6]/20 gap-1">
          <Tag className="h-3 w-3" /> {value}
        </Badge>
      </div>
    );
  }

  if (fieldType === 'LINK') {
    return (
      <div className="flex gap-2 text-sm">
        <label className="text-[11px] font-mono tracking-[0.15em] uppercase text-[#0826547a]">{label}</label>
        {/^https?:\/\//.test(value) ? (
          <a href={value} target="_blank" rel="noreferrer" className="inline-flex gap-1 text-[#0099d6] hover:text-[#082654] hover:underline">
            <LinkIcon className="h-3 w-3" /> {value}
          </a>
        ) : (
          <span className="text-[#082654]">{value}</span>
        )}
      </div>
    );
  }

  if (fieldType === 'DATE') {
    return (
      <div className="flex gap-2 text-sm items-center">
        <CalendarDays className="h-3.5 text-[#0826547a]" />
        <label className="text-[11px] font-mono tracking-[0.15em] uppercase text-[#0826547a]">{label}</label>
        <span className="text-sm text-[#082654]">{new Date(value).toLocaleDateString()}</span>
      </div>
    );
  }

  if (fieldType === 'NUMBER') {
    return (
      <div className="flex gap-2 text-sm items-center">
        <Hash className="h-3.5 text-[#0826547a]" />
        <label className="text-[11px] font-mono tracking-[0.15em] uppercase text-[#0826547a]">{label}</label>
        <span className="text-sm font-medium text-[#082654] tabular-nums">{value}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
      <label className="text-[11px] font-mono tracking-[0.15em] uppercase text-[#0826547a]">{label}</label>
      <span className="text-sm text-[#082654] leading-relaxed">{value}</span>
    </div>
  );
}

export function JobCard({ job }: { job: any }) {
  const navigate = useNavigate();
  const primary = (job.fields || []).filter((f: any) => f.section === 'PRIMARY');
  const secondary = (job.fields || []).filter((f: any) => f.section === 'SECONDARY');
  
  const locationField = (job.fields || []).find((f: any) => /location/i.test(f.label));

  return (
    <Card className="group flex flex-col overflow-hidden bg-white border-[#E5E7EB] rounded-2xl shadow-sm hover:shadow-[0_8px_30px_rgba(8,38,84,0.12)] hover:border-[#0099d6]/20 hover:-translate-y-1 transition-all duration-200">
      <div className="h-[3px] w-full bg-gradient-to-r from-[#0099d6] via-[#082654] to-[#0099d6] opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="p-5 sm:p-6 flex flex-col flex-1 gap-4">
        <header className="flex gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-[#F1F5F9] border border-[#E2E8F0] group-hover:bg-[#082654] flex items-center justify-center transition-colors">
            <Briefcase className="h-5 w-5 text-gray-400 group-hover:text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-[16px] font-semibold text-[#0F172A] group-hover:text-[#0099d6] line-clamp-2 transition-colors">
              {job.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {locationField && (
                <div className="flex items-center text-xs text-gray-500 gap-1">
                  <MapPin className="h-3 w-3" /> {locationField.value}
                </div>
              )}
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{job.fields?.length || 0} fields</Badge>
              <div className="flex items-center text-xs text-gray-500 gap-1">
                <Clock className="h-3 w-3" /> {job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : '—'}
              </div>
            </div>
          </div>
        </header>

        {primary.length > 0 && (
          <div className="space-y-2">
            {primary.slice(0, 3).map((f: any, i: number) => (
              <JobFieldValue key={i} field={f} />
            ))}
          </div>
        )}

        <Button variant="outline" className="rounded-full border-[#E2E8F0] bg-[#F8FAFC] w-full mt-2 text-xs h-8">
          More Info
        </Button>

        {secondary.length > 0 && (
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-lg space-y-2">
            {secondary.slice(0, 2).map((f: any, i: number) => (
              <JobFieldValue key={i} field={f} />
            ))}
          </div>
        )}

        <footer className="mt-auto pt-4 flex items-center justify-between border-t border-gray-100">
          <span className="font-mono text-[11px] text-[#94A3B8]">/careers/{job.slug}</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/careers/${job.slug}`)}>
              View Details
            </Button>
            <Button size="sm" className="bg-[#082654] hover:bg-[#0099d6] rounded-full text-white" onClick={() => navigate(`/careers/${job.slug}`)}>
              Apply Now
            </Button>
          </div>
        </footer>
      </div>
    </Card>
  );
}
