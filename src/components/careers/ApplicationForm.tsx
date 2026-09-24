import React, { useState } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ApplicationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
}

export function ApplicationForm({ open, onOpenChange, slug }: ApplicationFormProps) {
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    highestQualification: '',
    experience: '',
    currentCompany: '',
    resumeLink: '',
    coverNote: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClose = () => {
    onOpenChange(false);
    if (success) {
      setTimeout(() => {
        setSuccess(false);
        setFormData({
          fullName: '', email: '', phone: '', highestQualification: '', experience: '', currentCompany: '', resumeLink: '', coverNote: ''
        });
        setError(null);
      }, 300);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email address.');
      return;
    }
    if (!/^https?:\/\/.+/.test(formData.resumeLink)) {
      setError('Must be a valid http(s) URL.');
      return;
    }

    setSubmitting(true);
    try {
      const url = import.meta.env.VITE_API_URL || '/api';
      await axios.post(`${url}/careers/${slug}/apply`, formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to submit application.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else onOpenChange(val); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto bg-white">
        {success ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl">
              ✓
            </div>
            <h3 className="text-lg font-semibold text-[#082654]">Application received</h3>
            <p className="text-sm text-muted-foreground">We will email you with updates. Keep an eye on your inbox.</p>
            <Button className="mt-4 bg-[#0099d6] hover:bg-[#082654]" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Apply for this role</DialogTitle>
              <DialogDescription>Fill in your details. We will email you with updates. All fields marked * are required.</DialogDescription>
            </DialogHeader>

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Full Name *</Label>
                  <Input name="fullName" placeholder="e.g. Your name" required value={formData.fullName} onChange={handleChange} />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input type="email" name="email" placeholder="you@example.com" required value={formData.email} onChange={handleChange} />
                </div>
                <div>
                  <Label>Phone *</Label>
                  <Input name="phone" required value={formData.phone} onChange={handleChange} />
                </div>
                <div>
                  <Label>Highest Qualification *</Label>
                  <Input name="highestQualification" required value={formData.highestQualification} onChange={handleChange} />
                </div>
                <div>
                  <Label>Experience *</Label>
                  <Input name="experience" required value={formData.experience} onChange={handleChange} />
                </div>
                <div>
                  <Label>Current Company / Institution (optional)</Label>
                  <Input name="currentCompany" value={formData.currentCompany} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Resume / Portfolio Link *</Label>
                <Input name="resumeLink" required value={formData.resumeLink} onChange={handleChange} />
                <p className="text-[11px] text-muted-foreground">Must be a valid http(s) URL.</p>
              </div>

              <div className="space-y-1.5">
                <Label>Short Cover Note (optional)</Label>
                <Textarea name="coverNote" placeholder="Why this role? (max 2000 chars)" rows={3} maxLength={2000} value={formData.coverNote} onChange={handleChange} />
              </div>

              {error && (
                <div className="rounded border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" disabled={submitting} onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} className="bg-[#0099d6] hover:bg-[#082654]">
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
