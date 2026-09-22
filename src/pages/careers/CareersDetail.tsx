import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, Briefcase, Users, Clock, Bookmark, Tag, Hash, Link2, CalendarDays, Type, AlignLeft } from 'lucide-react';
import { PublicNavbar } from '@/components/careers/PublicNavbar';
import { PublicFooter } from '@/components/careers/PublicFooter';
import { ApplicationForm } from '@/components/careers/ApplicationForm';
import axios from 'axios';

export function CareersDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApply, setShowApply] = useState(false);
  const [saved, setSaved] = useState<string[]>(() => {
    try { const raw = localStorage.getItem('savedJobs_twinspace'); return raw ? JSON.parse(raw) : []; } catch { return []; }
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const base = (import.meta as any).env.VITE_API_URL || '/api';
        const url = `${base.replace(/\/$/, '')}/careers/${slug}`;
        const res = await axios.get(url);
        if (!cancelled) setJob(res.data);
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message || err?.message || 'Job not found');
      } finally { if (!cancelled) setLoading(false); }
    };
    if (slug) load();
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => { localStorage.setItem('savedJobs_twinspace', JSON.stringify(saved)); }, [saved]);

  const toggleSave = () => {
    if (!job) return;
    setSaved((prev: string[]) => prev.includes(job.id) ? prev.filter(v => v !== job.id) : [...prev, job.id]);
  };

  const formatDate = (d?: string) => { if (!d) return '—'; try { return new Date(d).toLocaleDateString(); } catch { return d; } };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" style={{ fontFamily: 'Figtree, Inter, sans-serif' }}>
        <div className="flex items-center gap-2 text-sm text-gray-500"><Clock className="h-4 w-4 animate-spin" /> Loading...</div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: 'Figtree, Inter, sans-serif' }}>
        <PublicNavbar />
        <div className="flex-1 max-w-3xl mx-auto px-6 py-16 text-center w-full">
          <p className="text-sm text-gray-700">{error || 'Job not found'}</p>
          <Link to="/careers" className="mt-4 inline-block"><Button className="bg-slate-700 hover:bg-slate-800">Back to Jobs</Button></Link>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const primary: any[] = (job.fields || []).filter((f: any) => f.section === 'PRIMARY').sort((a: any, b: any) => a.order - b.order);
  const secondary: any[] = (job.fields || []).filter((f: any) => f.section === 'SECONDARY').sort((a: any, b: any) => a.order - b.order);

  const skills: string[] = [];
  (job.fields || []).forEach((f: any) => {
    if (f.fieldType === 'TAG') f.value.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((v: string) => skills.push(v));
    if (/skill/i.test(f.label) && f.fieldType !== 'TAG') f.value.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((v: string) => skills.push(v));
  });
  const uniqueSkills = Array.from(new Set(skills));
  const isSaved = saved.includes(job.id);
  const isFeatured = primary.length > 1;

  const descriptionField = [...primary, ...secondary].find(f => f.fieldType === 'TEXTAREA' && f.value.length > 30) || primary.find(f => /desc/i.test(f.label));
  const benefitsField = secondary.find(f => /benefit|perk/i.test(f.label));

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

  return (
    <div className="min-h-screen bg-white flex flex-col" style={{ fontFamily: 'Figtree, Inter, sans-serif' }}>
      <PublicNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full">
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="lg:w-2/3">
            <Card className="mb-5 overflow-hidden border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 -ml-2 h-7 text-xs" onClick={() => navigate('/careers')}>
                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />Back to Jobs
                  </Button>
                </div>

                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h1 className="text-xl font-bold text-gray-900 break-words leading-tight">{job.title}</h1>
                      <div className="flex gap-2 shrink-0">
                        {isFeatured && <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 text-[10px] h-5 px-2"><Star className="h-3 w-3 mr-1" />Featured</Badge>}
                      </div>
                    </div>

                    {/* Only stored PRIMARY fields — simple adjustable pills */}
                    {primary.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {primary.map((f: any) => {
                          const isLink = f.fieldType === 'LINK';
                          return (
                            <div key={f.id} className="inline-flex items-center gap-1.5 bg-gray-50 border rounded-full px-3 py-1.5">
                              <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">{f.label}:</span>
                              {isLink ? (
                                <a href={f.value} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-600 hover:underline max-w-[160px] truncate">{f.value}</a>
                              ) : (
                                <span className="text-xs font-medium text-gray-900 max-w-[160px] truncate" title={f.value}>{f.value}</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mb-3 rounded-full bg-gray-50 border border-dashed px-3 py-1.5 text-xs text-gray-500 inline-flex">No PRIMARY fields</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {descriptionField && (
              <Card className="mb-5 border shadow-sm">
                <CardContent className="p-4">
                  <h2 className="text-sm font-semibold text-gray-900 mb-3">Job Description</h2>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{descriptionField.value}</p>
                </CardContent>
              </Card>
            )}

            {secondary.length > 0 ? (
              <Card className="mb-5 border shadow-sm">
                <CardContent className="p-4">
                  <h2 className="text-sm font-semibold text-gray-900 mb-3">Additional Information</h2>
                  <div className="flex flex-wrap gap-2">
                    {secondary.map((f) => {
                      const isLink = f.fieldType === 'LINK';
                      return (
                        <div key={f.id} className="inline-flex items-center gap-1.5 bg-gray-50 border rounded-full px-3 py-1.5">
                          <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">{f.label}:</span>
                          {isLink ? (
                            <a href={f.value} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-blue-600 hover:underline max-w-[160px] truncate">{f.value}</a>
                          ) : (
                            <span className="text-xs font-medium text-gray-900 max-w-[160px] truncate" title={f.value}>{f.value}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="mb-5 border border-dashed shadow-none">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-gray-500">No SECONDARY fields stored.</p>
                </CardContent>
              </Card>
            )}

            {benefitsField && (
              <Card className="mb-5 border shadow-sm">
                <CardContent className="p-4">
                  <h2 className="text-sm font-semibold text-gray-900 mb-3">Benefits</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">{benefitsField.value}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:w-1/3">
            <Card className="mb-4 border shadow-sm">
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Ready to Apply?</h3>
                  <p className="text-xs text-gray-500">Join our team and make a difference</p>
                </div>
                <Button className="w-full bg-slate-700 hover:bg-slate-800 text-white h-9 text-sm" onClick={() => setShowApply(true)}>Apply for This Position</Button>
                <div className="border-t border-gray-100 my-4" />
                <div className="flex justify-between gap-2 text-xs">
                  <span className="text-gray-500">Posted</span><span className="font-medium">{formatDate(job.publishedAt)}</span>
                </div>
              </CardContent>
            </Card>


          </div>
        </div>
      </div>

      <ApplicationForm slug={slug as string} open={showApply} onOpenChange={setShowApply} />

      <PublicFooter />
    </div>
  );
}

export default CareersDetail;
