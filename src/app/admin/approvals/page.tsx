'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ExpertProfile } from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function AdminApprovalsPage() {
  const { refreshUserData } = useAuth();
  const [pendingExperts, setPendingExperts] = useState<ExpertProfile[]>([]);
  const [approvedExperts, setApprovedExperts] = useState<ExpertProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadExperts = async () => {
    try {
      const [resPend, resAppr] = await Promise.all([
        fetch('/api/experts?status=PENDING'),
        fetch('/api/experts?status=APPROVED'),
      ]);
      const dataPend = await resPend.json();
      const dataAppr = await resAppr.json();
      if (dataPend.success) setPendingExperts(dataPend.experts);
      if (dataAppr.success) setApprovedExperts(dataAppr.experts);
    } catch (err) {
      console.error('Error fetching expert approvals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExperts();
  }, []);

  const handleApprove = async (userId: string, name: string) => {
    try {
      const res = await fetch(`/api/experts/${userId}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`🎉 ${name} has been approved! Their query feed and chat access are unlocked.`);
        await loadExperts();
        await refreshUserData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (userId: string, name: string) => {
    const reason = prompt('Enter rejection reason for expert applicant:', 'Academic credentials could not be verified with the university registrar.');
    if (!reason) return;

    try {
      const res = await fetch(`/api/experts/${userId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (data.success) {
        setActionMessage(`Application for ${name} rejected.`);
        await loadExperts();
        await refreshUserData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
            Gatekeeper Console
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Expert Onboarding & Credential Verification Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Strict quality assurance: Only approved experts can accept student assignments or message on the platform.
          </p>
        </div>

        {/* Action Alert Banner */}
        {actionMessage && (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800 flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{actionMessage}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* PENDING APPROVAL QUEUE */}
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-amber-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                Pending Verification Applications ({pendingExperts.length})
              </h3>
            </div>
            <span className="text-xs text-amber-800 font-medium">
              Action Required
            </span>
          </div>

          {pendingExperts.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">Zero pending applications!</p>
              <p className="mt-0.5">All expert candidates have been audited.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 p-6 space-y-6">
              {pendingExperts.map((exp) => (
                <div
                  key={exp.id}
                  className="rounded-2xl border border-amber-200 bg-amber-50/20 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={exp.user?.avatar}
                      alt={exp.user?.name}
                      className="h-16 w-16 rounded-2xl object-cover ring-2 ring-amber-300 shadow-xs"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900">
                          {exp.user?.name}
                        </h4>
                        <span className="font-mono text-xs text-slate-400">
                          ({exp.user?.maskedId})
                        </span>
                        <span className="rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] px-2 py-0.5">
                          PENDING
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-800 mt-1">
                        {exp.title}
                      </p>

                      <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl">
                        {exp.bio}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                        <span>Academic Degree: <strong className="text-slate-800">{exp.qualifications}</strong></span>
                        <span>•</span>
                        <span>Proposed Rate: <strong className="text-slate-800">{formatCurrency(exp.hourlyRate)}/hr</strong></span>
                      </div>

                      {/* Admin visible audit contact info */}
                      <div className="mt-2 text-[11px] font-mono text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md inline-block">
                        🛡️ Admin Audit: {exp.user?.email} | {exp.user?.phone}
                      </div>

                      {/* Verification Document link */}
                      <div className="mt-3">
                        <a
                          href={`/mock-files/${exp.verificationDoc || 'IIT_Degree_Dr_Arvind.pdf'}`}
                          download
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                        >
                          <FileText className="h-3.5 w-3.5 text-brand-600" />
                          <span>View Submitted ID / Degree: {exp.verificationDoc || 'Transcript.pdf'}</span>
                          <Download className="h-3.5 w-3.5 text-slate-400 ml-1" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* 1-Click Action Buttons */}
                  <div className="flex flex-row md:flex-col items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(exp.userId, exp.user?.name || 'Expert')}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>1-Click Approve</span>
                    </button>

                    <button
                      onClick={() => handleReject(exp.userId, exp.user?.name || 'Expert')}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CURRENTLY APPROVED EXPERTS TABLE */}
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Approved Active Experts ({approvedExperts.length})
            </h3>
            <span className="text-xs text-emerald-700 font-semibold">
              ✓ Active on Marketplace
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {approvedExperts.map((exp) => (
              <div key={exp.id} className="p-5 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={exp.user?.avatar}
                    alt={exp.user?.name}
                    className="h-10 w-10 rounded-xl object-cover ring-2 ring-slate-100"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span>{exp.user?.name}</span>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="font-mono text-[10px] text-slate-400">({exp.user?.maskedId})</span>
                    </div>
                    <p className="text-slate-500 text-[11px] mt-0.5">{exp.title}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-800">{formatCurrency(exp.hourlyRate)}/hr</span>
                  <span className="font-semibold text-amber-500 bg-amber-50 px-2 py-0.5 rounded">
                    ★ {exp.rating} ({exp.reviewCount})
                  </span>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                    APPROVED
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
