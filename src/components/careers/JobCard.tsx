import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Briefcase, ExternalLink, MapPin, Clock } from 'lucide-react';
import { JobFieldValue } from './JobFieldValue';
import { useNavigate } from 'react-router-dom';

interface JobField {
 id: string;
 label: string;
 value: string;
 fieldType: string;
 section: string;
 order: number;
}

interface JobPosting {
 id: string;
 title: string;
 slug: string;
 status: string;
 fields: JobField[];
 publishedAt?: string;
}

export function JobCard({
 job,
 onMoreInfo,
 expanded,
 fullFields,
 onApply,
}: {
 job: JobPosting;
 onMoreInfo?: (job: JobPosting) => void;
 expanded?: boolean;
 fullFields?: JobField[];
 onApply?: (slug: string) => void;
}) {
 const [localExpanded, setLocalExpanded] = useState(!!expanded);
 const navigate = useNavigate();
 const isExpanded = expanded !== undefined ? expanded : localExpanded;
 const primary = job.fields?.filter((f) => f.section === 'PRIMARY').sort((a, b) => a.order - b.order) || [];
 const secondary = (fullFields || job.fields || []).filter((f) => f.section === 'SECONDARY').sort((a, b) => a.order - b.order);
 const hasSecondary = secondary.length > 0;

 const toggle = () => {
 if (onMoreInfo) onMoreInfo(job);
 else setLocalExpanded((v) => !v);
 };

 const locationField = primary.find((f) => /location|place|branch|city/i.test(f.label)) || primary[0];
 const typeField = primary.find((f) => /type|employment|category/i.test(f.label));

 return (
 <Card className="group flex flex-col overflow-hidden bg-white border-gray-200 dark:border-gray-800 rounded-lg shadow-sm hover:shadow-[0_8px_30px_rgba(8,38,84,0.12)] hover:border-[#0099d6]/40 transition-all duration-200"style={{ fontFamily: 'Figtree, Inter, sans-serif' }}>
 {/* Top accent bar */}
 <div className="h-[3px] w-full bg-gradient-to-r from-[#0099d6] via-[#082654] to-[#0099d6] opacity-0 group-hover:opacity-100 transition-opacity"/>

 <div className="p-5 sm:p-6 flex flex-col flex-1 gap-4">
 {/* Header */}
 <div className="flex items-start gap-3.5">
 <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 group-hover:bg-[#082654] group-hover:border-[#082654] group-hover:text-white transition-colors">
 <Briefcase className="h-5 w-5 text-slate-500 group-hover:text-white transition-colors"/>
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="text-[16px] font-semibold leading-tight text-slate-900 line-clamp-2 group-hover:text-[#0099d6] transition-colors">
 {job.title}
 </h3>
 <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
 {locationField && (
 <span className="inline-flex items-center gap-1 text-slate-500">
 <MapPin className="h-3 w-3"/> {locationField.value}
 </span>
 )}
 {typeField && (
 <>
 <span className="h-1 w-1 rounded-full bg-slate-300"/>
 <Badge variant="secondary"className="h-5 px-2 rounded-full bg-[#0099d6]/10 text-[#0099d6] border-[#0099d6]/20 text-[11px] font-medium hover:bg-[#0099d6]/15">
 {typeField.value}
 </Badge>
 </>
 )}
 {job.publishedAt && (
 <>
 <span className="h-1 w-1 rounded-full bg-slate-300 hidden sm:inline"/>
 <span className="inline-flex items-center gap-1 text-slate-400 hidden sm:inline-flex">
 <Clock className="h-3 w-3"/> {new Date(job.publishedAt).toLocaleDateString()}
 </span>
 </>
 )}
 </div>
 </div>
 </div>

 {/* Primary fields */}
 <div className="space-y-2.5">
 {primary.length === 0 ? (
 <p className="text-xs text-slate-400 italic">No details provided.</p>
 ) : (
 <div className="grid gap-2">
 {primary.slice(0, 3).map((f) => (
 <JobFieldValue key={f.id} field={f} />
 ))}
 {primary.length > 3 && !isExpanded && (
 <p className="text-xs text-slate-400">+{primary.length - 3} more</p>
 )}
 {isExpanded && primary.slice(3).map((f) => <JobFieldValue key={f.id} field={f} />)}
 </div>
 )}
 </div>

 {/* Secondary expand */}
 {hasSecondary && (
 <div className="pt-1">
 {!isExpanded ? (
 <Button
 onClick={toggle}
 variant="outline"
 className="w-full justify-between rounded-full border-slate-200 bg-slate-50 text-slate-700 hover:bg-[#082654] hover:text-white text-sm h-9"
 >
 More Info
 <ChevronDown className="h-4 w-4 opacity-70"/>
 </Button>
 ) : (
 <div className="space-y-3">
 <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2.5">
 <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-slate-500">Additional Details</p>
 {secondary.map((f) => (
 <JobFieldValue key={f.id} field={f} />
 ))}
 </div>
 <div className="flex gap-2">
 <Button variant="ghost"size="sm"onClick={toggle} className="flex-1 gap-1 text-slate-500 hover:text-slate-900 rounded-full">
 <ChevronUp className="h-4 w-4"/> Show Less
 </Button>
 <Button size="sm"className="flex-1 gap-1 bg-[#0099d6] hover:bg-[#082654] text-white rounded-full shadow-sm"onClick={() => navigate(`/careers/${job.slug}`)}>
 <ExternalLink className="h-4 w-4"/> View Job
 </Button>
 </div>
 </div>
 )}
 </div>
 )}

 {/* Footer actions */}
 <div className="mt-auto flex items-center gap-2 pt-2 border-t border-slate-100">
 <Button
 variant="ghost"
 size="sm"
 className="flex-1 rounded-full text-slate-700 hover:bg-slate-100 hover:text-[#082654] gap-1.5"
 onClick={() => navigate(`/careers/${job.slug}`)}
 >
 View Details <ExternalLink className="h-3.5 w-3.5"/>
 </Button>
 <Button
 size="sm"
 className="flex-1 rounded-full bg-[#082654] hover:bg-[#0099d6] text-white shadow-sm gap-1.5"
 onClick={() => {
 if (onApply) onApply(job.slug);
 else navigate(`/careers/${job.slug}`);
 }}
 >
 Apply Now
 </Button>
 </div>

 <p className="text-[11px] text-center text-slate-400 font-mono">/careers/{job.slug}</p>
 </div>
 </Card>
 );
}
