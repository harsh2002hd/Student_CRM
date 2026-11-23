'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { SUPPORTED_COUNTRIES } from '@/lib/currencies';
import {
  Upload,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  FileText,
  X,
  CheckCircle2,
  Paperclip,
  Radio,
} from 'lucide-react';

const SUBJECT_OPTIONS = [
  'Machine Learning',
  'Computer Science',
  'Economics',
  'Calculus',
  'Statistics',
  'Organic Chemistry',
  'Biology',
  'Physics',
  'Finance & Accounting',
  'Electrical Engineering',
  'Literature & Academic Writing',
];

export default function SubmitQueryPage() {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [subject, setSubject] = useState(SUBJECT_OPTIONS[0]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('2026-11-28T18:00');
  const [budget, setBudget] = useState('85');
  const [urgency, setUrgency] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; size: string; type: string; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successQueryId, setSuccessQueryId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.file) {
        setUploadedFiles((prev) => [...prev, data.file]);
      } else {
        alert(data.error || 'Failed to upload attachment.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !deadline) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/queries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentUser.id,
          subject,
          title,
          description,
          deadline: new Date(deadline).toISOString(),
          budget: Number(budget) || 80,
          currency: currentUser.currency || 'USD',
          urgency,
          attachments: uploadedFiles,
        }),
      });

      const data = await res.json();
      if (data.success && data.query) {
        setSuccessQueryId(data.query.id);
      }
    } catch (err) {
      console.error('Error submitting query', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        
        {/* Header Breadcrumb */}
        <div className="mb-8">
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Step 1 • Problem Submission
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            Post an Assignment, Question, or Project Query
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Fill in the requirements below. Verified academic mentors across the globe will review your task in real time.
          </p>
        </div>

        {/* Success State */}
        {successQueryId ? (
          <div className="rounded-3xl bg-white p-8 shadow-xl border border-slate-100 text-center animate-in fade-in zoom-in-95">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Query Broadcasted Globally!
            </h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Your task is now live on the marketplace. Mentors matching your subject will connect with you via real-time WhatsApp chat.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => router.push('/student/experts')}
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-700 shadow-md shadow-brand-500/20"
              >
                Browse & Match Mentors →
              </button>
              <button
                onClick={() => router.push('/student')}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Strict Anti-Leak Warning */}
            <div className="rounded-2xl bg-amber-50 border border-amber-200/80 p-4 text-xs text-amber-900 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Global Privacy Shield Protocol:</strong>
                <span>
                  Never include your personal mobile number, email, or external links in descriptions or attachments. All communications are strictly masked and protected.
                </span>
              </div>
            </div>

            {/* Form Fields Card */}
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-5">
              
              {/* Subject & Urgency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Subject / Academic Discipline *
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-800 font-semibold focus:outline-brand-500 focus:bg-white"
                  >
                    {SUBJECT_OPTIONS.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Urgency Priority Level
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setUrgency(lvl)}
                        className={`rounded-lg py-2 text-[10px] font-bold uppercase transition-all ${
                          urgency === lvl
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Query Title / Core Question *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ridge Regression Regularization Matrix Derivation & Overfitting debug"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-brand-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Detailed Problem Description & Specific Doubts *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Specify problem requirements, theorems, tools (e.g. Python, R, MATLAB), and what deliverable format you require from the mentor..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-brand-500 leading-relaxed"
                />
              </div>

              {/* Deadline & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Hard Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 font-medium focus:outline-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Estimated Budget ({currentUser.currency || 'USD'})
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 font-semibold focus:outline-brand-500"
                    />
                  </div>
                </div>
              </div>

              {/* Real File Upload Zone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Upload Assignment PDF, Code, or Rubric
                </label>
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.docx,.zip,.py,.ipynb,.csv,.txt"
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-slate-300 p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center">
                      <Radio className="h-8 w-8 text-brand-600 animate-spin mb-2" />
                      <p className="text-xs font-bold text-brand-600">Uploading file to server...</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-brand-600 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-800">
                        Click to upload real assignment PDF, code, or data files
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Supports PDF, DOCX, ZIP, PY, IPYNB, CSV (Max 25MB)
                      </p>
                    </>
                  )}
                </div>

                {/* Uploaded files list */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-brand-600" />
                          <span className="font-semibold text-slate-800">{file.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({file.size})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Submit Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/25 hover:from-brand-700 hover:to-indigo-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Broadcasting Task...' : 'Broadcast to Verified Mentors'}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
