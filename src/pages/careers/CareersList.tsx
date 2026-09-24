import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Star, Briefcase, Clock, Bookmark, Tag, Hash, Link2, CalendarDays, Type, AlignLeft } from 'lucide-react';
import { PublicNavbar } from '@/components/careers/PublicNavbar';
import { PublicFooter } from '@/components/careers/PublicFooter';
import { ApplicationForm } from '@/components/careers/ApplicationForm';
import axios from 'axios';
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

const formatDate = (d?: string) => {
 if (!d) return '—';
 try { return new Date(d).toLocaleDateString(); } catch { return d; }
};

const fieldIconMap: Record<string, React.ElementType> = {
 TEXT: Type,
 TEXTAREA: AlignLeft,
 NUMBER: Hash,
 DATE: CalendarDays,
 TAG: Tag,
 LINK: Link2,
};

const fieldColorMap: Record<string, string> = {
 TEXT: 'text-blue-600',
 TEXTAREA: 'text-slate-600',
 NUMBER: 'text-emerald-600',
 DATE: 'text-purple-600',
 TAG: 'text-amber-600',
 LINK: 'text-sky-600',
};

export function CareersList() {
 const navigate = useNavigate();
 const [jobs, setJobs] = useState<JobPosting[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 const [k, setK] = useState('');
 const [x, setX] = useState('All');
 const [A, setA] = useState('newest');
 const [saved, setSaved] = useState<string[]>(() => {
 try { const raw = localStorage.getItem('savedJobs_twinspace'); return raw ? JSON.parse(raw) : []; } catch { return []; }
 });
 const [applySlug, setApplySlug] = useState<string | null>(null);
 const [dynamicFilters, setDynamicFilters] = useState<Record<string, string>>({});

 useEffect(() => {
 let cancelled = false;
 const fetch = async () => {
 try {
 setLoading(true);
 setError(null);
 const base = (import.meta as any).env.VITE_API_URL || '/api';
 const url = `${base.replace(/\/$/, '')}/careers`;
 const res = await axios.get(url);
 if (!cancelled) setJobs(Array.isArray(res.data) ? res.data : []);
 } catch (err: any) {
 if (!cancelled) setError(err?.response?.data?.message || err?.message || 'Failed to load');
 } finally { if (!cancelled) setLoading(false); }
 };
 fetch();
 return () => { cancelled = true; };
 }, []);

 useEffect(() => { localStorage.setItem('savedJobs_twinspace', JSON.stringify(saved)); }, [saved]);

 const toggleSave = (id: string) => {
 setSaved((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]);
 };

 // Only fields stored in table rows — build filter groups from actual PRIMARY fields
 const fieldGroups = useMemo(() => {
 const map = new Map<string, { label: string; values: Set<string>; fieldType: string }>();
 jobs.forEach((job) => {
 (job.fields || []).filter(f => f.section === 'PRIMARY').forEach((ff) => {
 const norm = ff.label?.trim().toLowerCase();
 if (!norm) return;
 if (!map.has(norm)) map.set(norm, { label: ff.label.trim(), values: new Set(), fieldType: ff.fieldType });
 if (ff.value?.trim()) map.get(norm)!.values.add(ff.value.trim());
 });
 });
 return Array.from(map.values())
 .map(g => ({ label: g.label, norm: g.label.trim().toLowerCase(), options: Array.from(g.values).sort(), fieldType: g.fieldType }))
 .filter(g => g.options.length > 0)
 .sort((a, b) => a.label.localeCompare(b.label));
 }, [jobs]);

 const filtered = useMemo(() => {
 return jobs.filter((job) => {
 const l = k.toLowerCase();
 const hay = [job.title, ...(job.fields || []).map(f => `${f.label} ${f.value}`)].join(' ').toLowerCase();
 const matchesSearch = k.trim() === '' || hay.includes(l);
 if (!matchesSearch) return false;

 // Dynamic field filters — only stored fields
 for (const g of fieldGroups) {
 const selected = dynamicFilters[g.norm];
 if (!selected || selected === 'all') continue;
 const field = (job.fields || []).find(ff => ff.section === 'PRIMARY' && ff.label?.trim().toLowerCase() === g.norm);
 if (!field || field.value?.trim() !== selected) return false;
 }

 if (x === 'Featured Job') {
 const isFeatured = (job.fields || []).length > 1;
 if (!isFeatured) return false;
 } else if (x === 'Saved Job') {
 if (!saved.includes(job.id)) return false;
 }
 return true;
 }).sort((a, b) => {
 switch (A) {
 case 'title':
 return a.title.localeCompare(b.title);
 case 'newest':
 default:
 return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
 }
 });
 }, [jobs, k, x, A, saved, dynamicFilters, fieldGroups]);

 const getSkills = (job: JobPosting): string[] => {
 const tags: string[] = [];
 (job.fields || []).forEach((ff) => {
 if (ff.fieldType === 'TAG') ff.value.split(',').map(s => s.trim()).filter(Boolean).forEach(v => tags.push(v));
 if (/skill/i.test(ff.label) && ff.fieldType !== 'TAG') ff.value.split(',').map(s => s.trim()).filter(Boolean).forEach(v => tags.push(v));
 });
 return Array.from(new Set(tags));
 };

 const setFieldFilter = (norm: string, value: string) => {
 setDynamicFilters(prev => ({ ...prev, [norm]: value }));
 };

 const hasActiveFilters = k.trim() !== '' || x !== 'All' || Object.values(dynamicFilters).some(v => v && v !== 'all');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col" style={{ fontFamily: 'Figtree, Inter, sans-serif' }}>
      <PublicNavbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white relative overflow-hidden border-b border-indigo-900/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600/15 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/25 mb-4">
              ✨ Explore Opportunities
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4 text-white">
              Join Our Amazing Team
            </h1>
            <p className="text-base sm:text-lg text-slate-300 mb-8 max-w-2xl mx-auto font-normal">
              Discover exciting career opportunities and build your future with TwinSpace.
            </p>
            <div className="max-w-2xl mx-auto bg-white rounded-2xl p-2 shadow-2xl border border-gray-100">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search jobs, skills, or keywords..."
                    value={k}
                    onChange={(e) => setK(e.target.value)}
                    className="pl-11 border-0 focus-visible:ring-0 text-gray-900 placeholder:text-gray-400 text-sm h-11 bg-transparent"
                  />
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 h-11 rounded-xl shrink-0 transition-all shadow-md" type="button" tabIndex={-1}>
                  Search Jobs
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
 <div className="flex flex-col lg:flex-row gap-8">
 <div className="lg:w-1/4">
 <Card className="sticky top-4 border shadow-sm">
 <CardContent className="p-6">
 <h3 className="text-lg font-semibold mb-4 text-gray-900">Filter Jobs</h3>

 <div className="mb-6">
 <label className="block text-sm font-medium text-gray-700 mb-2">Job Category</label>
 <div className="flex flex-wrap gap-2">
 <Button variant={x === 'All' ? 'default' : 'outline'} size="sm"onClick={() => setX('All')} className="text-xs">All</Button>
 <Button variant={x === 'Featured Job' ? 'default' : 'outline'} size="sm"onClick={() => setX('Featured Job')} className="text-xs">Featured Job</Button>
 <Button variant={x === 'Saved Job' ? 'default' : 'outline'} size="sm"onClick={() => setX('Saved Job')} className="text-xs">Saved Job</Button>
 </div>
 </div>

 {/* Dynamic filters — only fields stored in table rows */}
 {fieldGroups.length === 0 ? (
 <div className="mb-6 rounded-lg bg-gray-50 border border-dashed p-3 text-xs text-gray-500">No filterable PRIMARY fields stored yet.</div>
 ) : (
 fieldGroups.map((g) => (
 <div key={g.norm} className="mb-6">
 <label className="block text-sm font-medium text-gray-700 mb-2 truncate"title={g.label}>{g.label}</label>
 <Select value={dynamicFilters[g.norm] || 'all'} onValueChange={(v) => setFieldFilter(g.norm, v)}>
 <SelectTrigger><SelectValue placeholder={`All ${g.label}`} /></SelectTrigger>
 <SelectContent>
 <SelectItem value="all">All {g.label}</SelectItem>
 {g.options.map((opt) => (
 <SelectItem key={opt} value={opt}>{opt}</SelectItem>
 ))}
 </SelectContent>
 </Select>
 </div>
 ))
 )}

 <div>
 <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
 <Select value={A} onValueChange={setA}>
 <SelectTrigger><SelectValue /></SelectTrigger>
 <SelectContent>
 <SelectItem value="newest">Newest First</SelectItem>
 <SelectItem value="title">Job Title A-Z</SelectItem>
 </SelectContent>
 </Select>
 </div>

 {hasActiveFilters && (
 <Button variant="ghost"size="sm"className="w-full mt-4 text-gray-600"onClick={() => { setK(''); setX('All'); setDynamicFilters({}); }}>
 Clear filters
 </Button>
 )}
 </CardContent>
 </Card>
 </div>

 <div className="lg:w-3/4">
 <div className="flex items-center justify-between mb-6">
 <h3 className="text-2xl font-bold text-gray-900">All Positions</h3>
 <span className="text-sm text-gray-500">{filtered.length} jobs found</span>
 </div>

 {loading ? (
 <div className="space-y-6">
 {[...Array(3)].map((_, i) => (
 <Card key={i} className="border shadow-sm animate-pulse"><CardContent className="p-6"><div className="h-6 bg-gray-100 rounded w-1/3 mb-4"/><div className="h-4 bg-gray-100 rounded w-full mb-2"/></CardContent></Card>
 ))}
 </div>
 ) : error ? (
 <Card className="border shadow-sm"><CardContent className="p-8 text-center"><p className="text-sm text-gray-700">{error}</p><Button className="mt-4 bg-slate-700 hover:bg-slate-800"onClick={() => window.location.reload()}>Retry</Button></CardContent></Card>
 ) : filtered.length === 0 ? (
 <div className="text-center py-12">
 <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4"/>
 <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
 <p className="text-gray-600">Try adjusting your search criteria or filters</p>
 {hasActiveFilters && <Button variant="outline"className="mt-4"onClick={() => { setK(''); setX('All'); setDynamicFilters({}); }}>Clear filters</Button>}
 </div>
 ) : (
 <div className="grid gap-4 sm:grid-cols-2">
 {filtered.map((job) => {
 const isFeatured = (job.fields || []).length > 1;
 const skills = getSkills(job);
 const primary = (job.fields || []).filter(ff => ff.section === 'PRIMARY').sort((a,b)=>a.order-b.order);
 return (
 <Card key={job.id} className="border border-gray-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 rounded-xl overflow-hidden bg-white flex flex-col">
 <CardContent className="p-4 flex flex-col flex-1 gap-3">
 <div className="flex items-start justify-between gap-2">
 <h4 className="text-[15px] font-semibold text-gray-900 leading-tight line-clamp-2 flex-1">{job.title}</h4>
 {isFeatured && (
 <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 shrink-0 px-2 py-0 text-[10px] h-5">
 <Star className="h-3 w-3 mr-1"/>Featured
 </Badge>
 )}
 </div>
 <div className="flex items-center text-gray-500 gap-1.5 -mt-1">
 <Briefcase className="h-3.5 w-3.5 text-slate-400"/>
 <span className="text-xs">{(job.fields || []).length} fields · {formatDate(job.publishedAt)}</span>
 </div>

 {primary.length > 0 ? (
 <div className="grid gap-2">
 {primary.slice(0, 3).map((ff) => {
 const isLink = ff.fieldType === 'LINK';
 return (
 <div key={ff.id} className="flex items-center bg-gray-50 rounded-lg px-2.5 py-2 gap-2">
 <span className="text-[11px] font-medium text-gray-500 truncate max-w-[70px]"title={ff.label}>{ff.label}</span>
 <span className="flex-1"/>
 {isLink ? (
 <a href={ff.value} target="_blank"rel="noopener noreferrer"className="font-medium text-xs text-blue-600 hover:underline truncate max-w-[120px]">{ff.value}</a>
 ) : (
 <span className="font-medium text-xs text-gray-900 truncate max-w-[120px]"title={ff.value}>{ff.value}</span>
 )}
 </div>
 );
 })}
 {primary.length > 3 && <p className="text-[11px] text-gray-400">+{primary.length - 3} more</p>}
 </div>
 ) : (
 <div className="rounded-lg bg-gray-50 border border-dashed px-3 py-2 text-xs text-gray-500 text-center">No PRIMARY fields</div>
 )}

 {skills.length > 0 && (
 <div className="flex flex-wrap gap-1.5">
 {skills.slice(0, 4).map((s) => (
 <Badge key={s} variant="outline"className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-0 text-[11px] h-5">{s}</Badge>
 ))}
 {skills.length > 4 && <span className="text-[11px] text-gray-400">+{skills.length - 4}</span>}
 </div>
 )}

 <div className="pt-3 border-t border-gray-100 mt-auto flex justify-end">
 <Button size="sm"className="bg-slate-800 hover:bg-slate-900 text-white h-8 text-xs px-4 rounded-full"onClick={() => navigate(`/careers/${job.slug}`)}>View Details</Button>
 </div>
 </CardContent>
 </Card>
 );
 })}
 </div>
 )}
 </div>
 </div>
 </div>

 {applySlug && <ApplicationForm slug={applySlug} open={!!applySlug} onOpenChange={(o) => !o && setApplySlug(null)} />}

 <PublicFooter />
 </div>
 );
}

export default CareersList;
