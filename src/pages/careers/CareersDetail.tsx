import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Clock, Star } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PublicNavbar } from '@/components/careers/PublicNavbar';
import { PublicFooter } from '@/components/careers/PublicFooter';
import { ApplicationForm } from '@/components/careers/ApplicationForm';

export function CareersDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApply, setShowApply] = useState(false);

  const savedJobs = JSON.parse(localStorage.getItem('savedJobs_twinspace') || '[]');

  const loadJob = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = import.meta.env.VITE_API_URL || '/api';
      const res = await axios.get(`${url}/careers/${slug}`);
      setJob(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      loadJob();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-['Figtree',_sans-serif]">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4 animate-spin" /> Loading...
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-white flex flex-col font-['Figtree',_sans-serif]">
        <PublicNavbar />
        <div className="flex-1 max-w-3xl mx-auto px-6 py-16 text-center w-full">
          <p className="text-sm text-gray-700">{error || 'Job not found'}</p>
          <Link to="/careers">
            <Button className="mt-4 bg-slate-700 hover:bg-slate-800 text-white">Back to Jobs</Button>
          </Link>
        </div>
        <PublicFooter />
      </div>
    );
  }

  const isFeatured = (job.fields || []).length > 1;
  const primary = (job.fields || []).filter((f: any) => f.section === 'PRIMARY');
  const secondary = (job.fields || []).filter((f: any) => f.section === 'SECONDARY');
  
  const descriptionField = (job.fields || []).find((f: any) => (f.fieldType === 'TEXTAREA' && f.value.length > 30) || /desc/i.test(f.label));
  const benefitsField = (job.fields || []).find((f: any) => /benefit|perk/i.test(f.label));

  const renderPill = (f: any, i: number) => (
    <div key={i} className="inline-flex items-center gap-1.5 bg-gray-50 border rounded-full px-3 py-1.5">
      <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap">{f.label}:</span>
      {f.fieldType === 'LINK' ? (
        <a href={f.value} target="_blank" rel="noreferrer" className="text-xs font-medium text-blue-600 hover:underline max-w-[160px] truncate" title={f.value}>{f.value}</a>
      ) : (
        <span className="text-xs font-medium text-gray-900 max-w-[160px] truncate" title={f.value}>{f.value}</span>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex flex-col font-['Figtree',_sans-serif]">
      <PublicNavbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 w-full flex-1">
        <div className="flex flex-col lg:flex-row gap-5">
          
          {/* Left Column */}
          <div className="lg:w-2/3">
            <Card className="mb-5 overflow-hidden border shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 -ml-2 h-7 text-xs" onClick={() => navigate('/careers')}>
                    <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Jobs
                  </Button>
                </div>
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h1 className="text-xl font-bold text-gray-900 break-words leading-tight">{job.title}</h1>
                      <div className="flex gap-2 shrink-0">
                        {isFeatured && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 shrink-0 px-2 py-0 text-[10px] h-5">
                            <Star className="h-3 w-3 mr-1" /> Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {primary.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {primary.map(renderPill)}
                  </div>
                ) : (
                  <div className="mb-3 rounded-full bg-gray-50 border border-dashed px-3 py-1.5 text-xs text-gray-500 inline-flex">
                    No PRIMARY fields
                  </div>
                )}
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
                  <h2 className="text-sm font-semibold mb-3">Additional Information</h2>
                  <div className="flex flex-wrap gap-2">
                    {secondary.map(renderPill)}
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
                  <h2 className="text-sm font-semibold mb-3">Benefits</h2>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">{benefitsField.value}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:w-1/3">
            <Card className="sticky mb-4 border shadow-sm top-4">
              <CardContent className="p-4">
                <div className="text-center mb-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-1">Ready to Apply?</h3>
                  <p className="text-xs text-gray-500">Join our team and make a difference</p>
                </div>
                <Button className="w-full bg-slate-700 hover:bg-slate-800 text-white h-9 text-sm" onClick={() => setShowApply(true)}>
                  Apply for This Position
                </Button>
                <div className="border-t border-gray-100 my-4"></div>
                <div className="flex justify-between gap-2 text-xs">
                  <span className="text-gray-500">Posted</span>
                  <span className="font-medium">{job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : '—'}</span>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>

      <PublicFooter />
      
      {slug && <ApplicationForm open={showApply} onOpenChange={setShowApply} slug={slug} />}
    </div>
  );
}
