import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, Briefcase, Star } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PublicNavbar } from '@/components/careers/PublicNavbar';
import { PublicFooter } from '@/components/careers/PublicFooter';

export function CareersList() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [k, setK] = useState('');
  const [x, setX] = useState('All');
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, string>>({});
  const [A, setA] = useState('newest');

  const savedJobs = JSON.parse(localStorage.getItem('savedJobs_twinspace') || '[]');

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = import.meta.env.VITE_API_URL || '/api';
      const res = await axios.get(`${url}/careers`);
      setJobs(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const primaryFieldsMap = new Map<string, Set<string>>();
  jobs.forEach(job => {
    (job.fields || []).forEach((f: any) => {
      if (f.section === 'PRIMARY') {
        const norm = (f.label || '').trim().toLowerCase();
        if (!primaryFieldsMap.has(norm)) {
          primaryFieldsMap.set(norm, new Set());
        }
        primaryFieldsMap.get(norm)!.add(f.value);
      }
    });
  });

  const dynamicGroups = Array.from(primaryFieldsMap.entries())
    .map(([norm, valuesSet]) => {
      const originalLabel = jobs.find(j => (j.fields || []).find((f: any) => f.section === 'PRIMARY' && (f.label || '').trim().toLowerCase() === norm))?.fields?.find((f: any) => f.section === 'PRIMARY' && (f.label || '').trim().toLowerCase() === norm)?.label || norm;
      return {
        norm,
        label: originalLabel,
        options: Array.from(valuesSet).sort()
      };
    })
    .filter(g => g.options.length > 0)
    .sort((a, b) => a.label.localeCompare(b.label));

  const hasActiveFilters = k !== '' || x !== 'All' || Object.values(dynamicFilters).some(v => v !== 'all');

  const resetFilters = () => {
    setK('');
    setX('All');
    setDynamicFilters({});
  };

  const filteredJobs = jobs.filter(job => {
    const haystack = (job.title + ' ' + (job.fields || []).map((f: any) => `${f.label} ${f.value}`).join(' ')).toLowerCase();
    if (k && !haystack.includes(k.toLowerCase())) return false;

    if (x === 'Featured Job' && (!job.fields || job.fields.length <= 1)) return false;
    if (x === 'Saved Job' && !savedJobs.includes(job.id)) return false;

    for (const [norm, val] of Object.entries(dynamicFilters)) {
      if (val !== 'all') {
        const fieldMatch = (job.fields || []).find((f: any) => f.section === 'PRIMARY' && (f.label || '').trim().toLowerCase() === norm && f.value === val);
        if (!fieldMatch) return false;
      }
    }
    return true;
  }).sort((a, b) => {
    if (A === 'newest') {
      return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
    }
    return (a.title || '').localeCompare(b.title || '');
  });

  return (
    <div className="min-h-screen bg-white flex flex-col font-['Figtree',_sans-serif]">
      <PublicNavbar />

      <div className="bg-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-4xl font-bold mb-4">Join Our Amazing Team</h2>
          <p className="text-xl mb-8 text-slate-300">Discover exciting career opportunities and grow with us</p>
          <div className="max-w-2xl mx-auto bg-white rounded-lg p-2 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  placeholder="Search jobs, skills, or keywords..."
                  value={k}
                  onChange={(e) => setK(e.target.value)}
                  className="pl-10 border-0 focus:ring-0 text-gray-900 placeholder:text-gray-400 h-10"
                />
              </div>
              <Button className="bg-slate-700 hover:bg-slate-800 text-white px-6 shrink-0 h-10" type="button" tabIndex={-1}>
                Search Jobs
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Left Sidebar */}
          <div className="lg:w-1/4">
            <Card className="border shadow-sm sticky top-4">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Filter Jobs</h3>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Job Category</label>
                  <div className="flex flex-wrap gap-2">
                    {['All', 'Featured Job', 'Saved Job'].map(cat => (
                      <Button
                        key={cat}
                        size="sm"
                        variant={x === cat ? 'default' : 'outline'}
                        className="text-xs"
                        onClick={() => setX(cat)}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>

                {dynamicGroups.length > 0 ? (
                  dynamicGroups.map(g => (
                    <div key={g.norm} className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2 truncate" title={g.label}>
                        {g.label}
                      </label>
                      <Select
                        value={dynamicFilters[g.norm] || 'all'}
                        onValueChange={(val) => setDynamicFilters(prev => ({ ...prev, [g.norm]: val }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={`All ${g.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All {g.label}</SelectItem>
                          {g.options.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))
                ) : (
                  <div className="mb-6 rounded-lg bg-gray-50 border border-dashed p-3 text-xs text-gray-500">
                    No filterable PRIMARY fields stored yet.
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <Select value={A} onValueChange={setA}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="title">Job Title A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="w-full mt-4 text-gray-600" onClick={resetFilters}>
                    Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Content */}
          <div className="lg:w-3/4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">All Positions</h3>
              <span className="text-sm text-gray-500">{filteredJobs.length} jobs found</span>
            </div>

            {loading ? (
              <div className="space-y-6">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="border shadow-sm animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-100 rounded w-1/3 mb-4"></div>
                      <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <Card className="border shadow-sm">
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-gray-700">{error}</p>
                  <Button className="mt-4 bg-slate-700 hover:bg-slate-800" onClick={loadJobs}>Retry</Button>
                </CardContent>
              </Card>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900">No jobs found</h3>
                <p className="text-gray-600">Try adjusting your search criteria or filters</p>
                {hasActiveFilters && (
                  <Button variant="outline" className="mt-4" onClick={resetFilters}>Clear filters</Button>
                )}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredJobs.map(job => {
                  const isFeatured = (job.fields || []).length > 1;
                  const primaryFields = (job.fields || []).filter((f: any) => f.section === 'PRIMARY');
                  
                  let skills: string[] = [];
                  (job.fields || []).forEach((f: any) => {
                    if (f.fieldType === 'TAG' || /skill/i.test(f.label)) {
                      f.value.split(',').forEach((s: string) => {
                        const t = s.trim();
                        if (t && !skills.includes(t)) skills.push(t);
                      });
                    }
                  });

                  return (
                    <Card key={job.id} className="border border-gray-200 shadow-sm hover:shadow-md hover:border-slate-300 rounded-xl overflow-hidden bg-white flex flex-col transition-all duration-200">
                      <CardContent className="p-4 flex flex-col flex-1 gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-[15px] font-semibold text-gray-900 leading-tight line-clamp-2 flex-1">{job.title}</h4>
                          {isFeatured && (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 shrink-0 px-2 py-0 text-[10px] h-5">
                              <Star className="h-3 w-3 mr-1" /> Featured
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center text-gray-500 gap-1.5 -mt-1">
                          <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-xs">{(job.fields || []).length} fields · {job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : '—'}</span>
                        </div>
                        
                        {primaryFields.length > 0 ? (
                          <div className="grid gap-2">
                            {primaryFields.slice(0, 3).map((ff: any, i: number) => (
                              <div key={i} className="flex items-center bg-gray-50 rounded-lg px-2.5 py-2 gap-2">
                                <span className="text-[11px] font-medium text-gray-500 truncate max-w-[70px]" title={ff.label}>{ff.label}</span>
                                <span className="flex-1"></span>
                                {ff.fieldType === 'LINK' ? (
                                  <a href={ff.value} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate max-w-[120px]" title={ff.value}>{ff.value}</a>
                                ) : (
                                  <span className="font-medium text-xs text-gray-900 truncate max-w-[120px]" title={ff.value}>{ff.value}</span>
                                )}
                              </div>
                            ))}
                            {primaryFields.length > 3 && (
                              <p className="text-[11px] text-gray-400">+{primaryFields.length - 3} more</p>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-lg bg-gray-50 border border-dashed px-3 py-2 text-xs text-gray-500 text-center">
                            No PRIMARY fields
                          </div>
                        )}

                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {skills.slice(0, 4).map((s, i) => (
                              <Badge key={i} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-2 py-0 text-[11px] h-5">
                                {s}
                              </Badge>
                            ))}
                            {skills.length > 4 && (
                              <span className="text-[11px] text-gray-400">+{skills.length - 4}</span>
                            )}
                          </div>
                        )}

                        <div className="pt-3 border-t border-gray-100 mt-auto flex justify-end">
                          <Button size="sm" className="bg-slate-800 hover:bg-slate-900 text-white h-8 text-xs px-4 rounded-full" onClick={() => navigate(`/careers/${job.slug}`)}>
                            View Details
                          </Button>
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
      
      <PublicFooter />
    </div>
  );
}
