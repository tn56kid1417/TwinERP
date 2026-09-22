import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Star, Clock, Calendar, MapPin, Building, Briefcase } from 'lucide-react';
import { PublicNavbar } from '@/components/careers/PublicNavbar';
import { PublicFooter } from '@/components/careers/PublicFooter';
import { ApplicationForm } from '@/components/careers/ApplicationForm';
import axios from 'axios';

export default function CareersDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const base = (import.meta as any).env?.VITE_API_URL || '/api';
        const url = `${base.replace(/\/$/, '')}/careers/${slug}`;
        const res = await axios.get(url);
        if (!cancelled) setJob(res.data);
      } catch (err: any) {
        if (!cancelled) setError(err?.response?.data?.message || err?.message || 'Job opening not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (slug) load();
    return () => { cancelled = true; };
  }, [slug]);

  const formatDate = (d?: string) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString(); } catch { return d; }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0A0C10] flex flex-col justify-center items-center" style={{ fontFamily: 'Figtree, Inter, sans-serif' }}>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Clock className="h-5 w-5 animate-spin text-[#0099d6]" /> Loading opportunity details...
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0A0C10] flex flex-col" style={{ fontFamily: 'Figtree, Inter, sans-serif' }}>
        <PublicNavbar />
        <div className="flex-1 max-w-3xl mx-auto px-6 py-20 text-center w-full">
          <Briefcase className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{error || 'Job not found'}</h2>
          <p className="text-sm text-slate-500 mb-6">This opening may have closed or the link is incorrect.</p>
          <Link to="/careers">
            <Button className="bg-[#082654] hover:bg-[#0099d6] text-white">Back to All Openings</Button>
          </Link>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const primary: any[] = (job.fields || []).filter((f: any) => f.section === 'PRIMARY').sort((a: any, b: any) => a.order - b.order);
  const secondary: any[] = (job.fields || []).filter((f: any) => f.section === 'SECONDARY').sort((a: any, b: any) => a.order - b.order);

  const descriptionField = [...primary, ...secondary].find(f => f.fieldType === 'TEXTAREA' && f.value?.length > 30) || primary.find(f => /desc/i.test(f.label));
  const otherFields = [...primary, ...secondary].filter(f => f !== descriptionField);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0C10] flex flex-col text-slate-800 dark:text-slate-200" style={{ fontFamily: 'Figtree, Inter, sans-serif' }}>
      <PublicNavbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white h-8 text-xs gap-1.5"
            onClick={() => navigate('/careers')}
          >
            <ArrowLeft className="h-4 w-4" /> Back to All Positions
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Job Details */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-[#12161F] overflow-hidden">
              <div className="h-[4px] bg-gradient-to-r from-[#0099d6] to-[#082654]" />
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {job.title}
                  </h1>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs px-3 py-1">
                    Accepting Applications
                  </Badge>
                </div>

                {/* Primary Meta Tags */}
                <div className="flex flex-wrap gap-2.5 my-6">
                  {primary.map((f: any) => {
                    const isLink = f.fieldType === 'LINK';
                    return (
                      <div key={f.id} className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-full px-3.5 py-1.5 text-xs">
                        <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">{f.label}:</span>
                        {isLink ? (
                          <a href={f.value} target="_blank" rel="noopener noreferrer" className="font-medium text-[#0099d6] hover:underline">
                            {f.value}
                          </a>
                        ) : (
                          <span className="font-medium text-slate-800 dark:text-slate-200">{f.value}</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {descriptionField && (
                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider text-xs">
                      Role Overview & Responsibilities
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {descriptionField.value}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Information / Secondary Fields */}
            {otherFields.length > 0 && (
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-[#12161F] p-6 sm:p-8">
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-xs">
                  Role Details & Requirements
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {otherFields.map((f: any) => (
                    <div key={f.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">{f.label}</p>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{f.value}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Interview Pipeline */}
            {job.rounds && job.rounds.length > 0 && (
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl bg-white dark:bg-[#12161F] p-6 sm:p-8">
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider text-xs">
                  Interview & Evaluation Process
                </h2>
                <div className="space-y-4">
                  {job.rounds.map((round: any, idx: number) => (
                    <div key={round.id || idx} className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                      <div className="h-8 w-8 rounded-full bg-[#082654] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{round.title}</h4>
                        {round.shortDescription && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{round.shortDescription}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right Sticky Apply Box */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 border-slate-200 dark:border-slate-800 shadow-lg rounded-2xl bg-white dark:bg-[#12161F] p-6 text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Interested in this role?</h3>
              <p className="text-xs text-slate-500 mb-6">
                Submit your application online. Our HR & Hiring team reviews every candidate.
              </p>
              <Button
                className="w-full bg-[#0099d6] hover:bg-[#082654] text-white font-semibold py-3 h-11 rounded-xl shadow-md transition-all cursor-pointer text-sm"
                onClick={() => setShowApply(true)}
              >
                Apply Now
              </Button>

              <div className="border-t border-slate-100 dark:border-slate-800 my-6" />

              <div className="space-y-3 text-left text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Published Date:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{formatDate(job.publishedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Location / Workplace:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{job.location || 'Remote / Hybrid'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Employment Type:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{job.employmentType || 'Full-Time'}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {showApply && (
        <ApplicationForm
          slug={slug as string}
          open={showApply}
          onOpenChange={setShowApply}
        />
      )}

      <PublicFooter />
    </div>
  );
}
