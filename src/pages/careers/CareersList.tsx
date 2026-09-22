import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Briefcase, Star, Clock } from 'lucide-react';
import { PublicNavbar } from '@/components/careers/PublicNavbar';
import { PublicFooter } from '@/components/careers/PublicFooter';
import { ApplicationForm } from '@/components/careers/ApplicationForm';
import { JobCard } from '@/components/careers/JobCard';
import axios from 'axios';

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

export default function CareersList() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [saved, setSaved] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('savedJobs_twinspace');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [applySlug, setApplySlug] = useState<string | null>(null);
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        const base = (import.meta as any).env?.VITE_API_URL || '/api';
        const url = `${base.replace(/\/$/, '')}/careers`;
        const res = await axios.get(url);
        if (!cancelled) setJobs(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message || err?.message || 'Failed to load careers openings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchJobs();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    localStorage.setItem('savedJobs_twinspace', JSON.stringify(saved));
  }, [saved]);

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
      const q = search.toLowerCase();
      const hay = [job.title, ...(job.fields || []).map(f => `${f.label} ${f.value}`)].join(' ').toLowerCase();
      const matchesSearch = search.trim() === '' || hay.includes(q);
      if (!matchesSearch) return false;

      // Dynamic field filters
      for (const g of fieldGroups) {
        const selected = dynamicFilters[g.norm];
        if (!selected || selected === 'all') continue;
        const field = (job.fields || []).find(ff => ff.section === 'PRIMARY' && ff.label.trim().toLowerCase() === g.norm);
        if (!field || field.value.trim() !== selected) return false;
      }

      if (category === 'Featured Job') {
        const isFeatured = (job.fields || []).length > 1;
        if (!isFeatured) return false;
      } else if (category === 'Saved Job') {
        if (!saved.includes(job.id)) return false;
      }
      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'newest':
        default:
          return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
      }
    });
  }, [jobs, search, category, sortBy, saved, dynamicFilters, fieldGroups]);

  const setFieldFilter = (norm: string, value: string) => {
    setDynamicFilters(prev => ({ ...prev, [norm]: value }));
  };

  const hasActiveFilters = search.trim() !== '' || category !== 'All' || Object.values(dynamicFilters).some(v => v && v !== 'all');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0C10] flex flex-col text-slate-800 dark:text-slate-200" style={{ fontFamily: 'Figtree, Inter, sans-serif' }}>
      <PublicNavbar />

      {/* Hero Banner */}
      <div className="bg-[#082654] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,153,214,0.3),transparent_60%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs text-xs font-semibold text-sky-300 mb-4 border border-white/10">
              <span>🚀 We're hiring exceptional talent</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
              Shape the Future with TwinSpace
            </h1>
            <p className="text-lg sm:text-xl mb-8 text-slate-300 leading-relaxed font-normal">
              Explore open positions across engineering, product, operations, and design. Build next-generation technology with us.
            </p>
            <div className="max-w-2xl mx-auto bg-white dark:bg-[#151922] rounded-2xl p-2 shadow-2xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <Input
                    placeholder="Search by role, skills, keywords..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-11 border-0 focus-visible:ring-0 shadow-none text-slate-900 dark:text-white placeholder:text-slate-400 h-11 text-sm bg-transparent"
                  />
                </div>
                <Button className="bg-[#0099d6] hover:bg-[#082654] text-white px-6 h-11 rounded-xl shrink-0 font-medium" type="button">
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4 shrink-0">
            <Card className="sticky top-20 border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-[#12161F]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Filter Openings</h3>
                  {hasActiveFilters && (
                    <button
                      onClick={() => { setSearch(''); setCategory('All'); setDynamicFilters({}); }}
                      className="text-xs text-[#0099d6] hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">Category</label>
                  <div className="flex flex-wrap gap-2">
                    <Button variant={category === 'All' ? 'default' : 'outline'} size="sm" onClick={() => setCategory('All')} className="text-xs rounded-lg">
                      All
                    </Button>
                    <Button variant={category === 'Featured Job' ? 'default' : 'outline'} size="sm" onClick={() => setCategory('Featured Job')} className="text-xs rounded-lg">
                      Featured
                    </Button>
                  </div>
                </div>

                {/* Dynamic Filters */}
                {fieldGroups.map((g) => (
                  <div key={g.norm} className="mb-5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 truncate" title={g.label}>
                      {g.label}
                    </label>
                    <Select value={dynamicFilters[g.norm] || 'all'} onValueChange={(v) => setFieldFilter(g.norm, v)}>
                      <SelectTrigger className="rounded-lg text-xs h-9">
                        <SelectValue placeholder={`All ${g.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All {g.label}</SelectItem>
                        {g.options.map((opt) => (
                          <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Sort By</label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="rounded-lg text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="title">Job Title (A-Z)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job Listings */}
          <div className="lg:w-3/4 flex-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Active Positions</h2>
                <p className="text-xs text-slate-500 mt-0.5">Showing {filtered.length} available opportunities</p>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl animate-pulse p-6">
                    <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-2/3 mb-4" />
                    <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-full mb-2" />
                    <div className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded w-1/2" />
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-red-500 mb-4">{error}</p>
                  <Button className="bg-[#082654] hover:bg-[#0099d6] text-white" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#12161F] border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
                <Briefcase className="h-16 w-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No matching job openings found</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                  We could not find any active job positions matching your current search and filter settings.
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={() => { setSearch(''); setCategory('All'); setDynamicFilters({}); }}>
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                {filtered.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onApply={(slug) => setApplySlug(slug)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {applySlug && (
        <ApplicationForm
          slug={applySlug}
          open={!!applySlug}
          onOpenChange={(o) => !o && setApplySlug(null)}
        />
      )}

      <PublicFooter />
    </div>
  );
}
