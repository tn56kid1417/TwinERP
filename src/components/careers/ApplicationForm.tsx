import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import axios from 'axios';
import { CheckCircle } from 'lucide-react';

interface Props {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApplicationForm({ slug, open, onOpenChange }: Props) {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    qualification: '',
    experience: '',
    currentOrg: '',
    resumeLink: '',
    coverNote: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const validate = () => {
    if (!form.fullName.trim()) return 'Full Name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Invalid email address';
    if (!form.phone.trim()) return 'Phone number is required';
    if (!form.qualification.trim()) return 'Highest Qualification is required';
    if (!form.experience.trim()) return 'Experience is required';
    if (!form.resumeLink.trim()) return 'Resume or portfolio link is required';
    try {
      const u = new URL(form.resumeLink.trim());
      if (!['http:', 'https:'].includes(u.protocol)) return 'Resume link must be http(s)';
    } catch {
      return 'Invalid resume link URL (must include https://)';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        qualification: form.qualification.trim(),
        experience: form.experience.trim(),
        currentOrg: form.currentOrg.trim() || undefined,
        resumeLink: form.resumeLink.trim(),
        coverNote: form.coverNote.trim() || undefined,
      };
      const base = (import.meta as any).env?.VITE_API_URL || '/api';
      const url = `${base.replace(/\/$/, '')}/careers/${slug}/apply`;
      await axios.post(url, payload);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (o: boolean) => {
    if (!o) {
      if (success) {
        setSuccess(false);
        setForm({ fullName: '', email: '', phone: '', qualification: '', experience: '', currentOrg: '', resumeLink: '', coverNote: '' });
        setError(null);
      }
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#082654] dark:text-white">Apply for this role</DialogTitle>
          <DialogDescription>
            Fill in your details. We will email you with updates. All fields marked * are required.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-[#082654] dark:text-white">Application Received!</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              Thank you for applying. A confirmation email has been dispatched to <strong>{form.email}</strong>. Our talent team will review your application soon.
            </p>
            <Button onClick={() => handleClose(false)} className="mt-4 bg-[#0099d6] hover:bg-[#082654] text-white px-6">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name *</Label>
                <Input placeholder="e.g. Jane Doe" value={form.fullName} onChange={(e) => update('fullName', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Email Address *</Label>
                <Input type="email" placeholder="jane@example.com" value={form.email} onChange={(e) => update('email', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Phone Number *</Label>
                <Input placeholder="+91 9876543210" value={form.phone} onChange={(e) => update('phone', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Highest Qualification *</Label>
                <Input placeholder="B.Tech / MCA / B.Sc" value={form.qualification} onChange={(e) => update('qualification', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Years of Experience *</Label>
                <Input placeholder="e.g. 2 years / Fresher" value={form.experience} onChange={(e) => update('experience', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Current Company / College <span className="font-normal text-gray-400">(optional)</span></Label>
                <Input placeholder="Previous or current organization" value={form.currentOrg} onChange={(e) => update('currentOrg', e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Resume / Portfolio Link (Google Drive, LinkedIn, etc.) *</Label>
              <Input placeholder="https://drive.google.com/file/d/..." value={form.resumeLink} onChange={(e) => update('resumeLink', e.target.value)} required />
              <p className="text-[11px] text-gray-400">Must be a valid http(s) URL accessible for review.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Short Cover Note <span className="font-normal text-gray-400">(optional)</span></Label>
              <Textarea placeholder="Why would you love to work with us? (max 2000 chars)" value={form.coverNote} onChange={(e) => update('coverNote', e.target.value)} rows={3} maxLength={2000} />
            </div>

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-[#0099d6] hover:bg-[#082654] text-white">
                {submitting ? 'Submitting Application...' : 'Submit Application'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
