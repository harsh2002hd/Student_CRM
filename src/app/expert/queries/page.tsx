'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { StudentQuery } from '@/types';
import { formatGlobalAmount } from '@/lib/currencies';
import { formatDateTime } from '@/lib/utils';
import {
  Lock,
  Clock,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertTriangle,
  ArrowRight,
  Filter,
} from 'lucide-react';

export default function ExpertQueryFeedPage() {
  const router = useRouter();
  const { currentUser, isPendingApproval, switchUser } = useAuth();
  const [queries, setQueries] = useState<StudentQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isPendingApproval) {
      fetch('/api/queries?forExperts=true')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setQueries(data.queries);
          }
        })
        .catch((err) => console.error('Error fetching query feed', err))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [isPendingApproval]);

  const handleAcceptQuery = async (queryId: string) => {
    setAcceptingId(queryId);
    try {
      const res = await fetch(`/api/queries/${queryId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expertId: currentUser.id }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/chat');
      } else {
        alert(data.error || 'Failed to accept query');
      }
    } catch (err) {
      console.error('Accept query error', err);
    } finally {
      setAcceptingId(null);
    }
  };

  const curr = currentUser.currency || 'USD';

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                Marketplace Feed
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Incoming Broadcast Queries
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              Available Student Problem Sets & Assignment Tasks
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Review problem descriptions and requirements. Accept to initiate real-time WhatsApp chat and escrow creation.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-2 text-xs font-semibold">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Student contact details are strictly masked worldwide</span>
          </div>
        </div>

        {/* GATED STATE IF PENDING APPROVAL */}
        {isPendingApproval ? (
          <div className="rounded-3xl bg-white p-10 border border-amber-200 shadow-sm text-center">
            <div className="h-16 w-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Query Marketplace Locked (Pending Admin Verification)
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
              Your profile credentials (academic transcripts / verification ID) are currently undergoing verification by the platform operations team.
            </p>

            <button
              onClick={() => {
                switchUser('usr_admin');
                router.push('/admin/approvals');
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-sm"
            >
              <span>Switch to Admin & 1-Click Approve</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : (
          /* ACTIVE QUERY FEED */
          <div className="space-y-4">
            {queries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <Briefcase className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-slate-800">No open queries available</h3>
                <p className="text-xs text-slate-500 mt-1">
                  All current student queries have been assigned to mentors. Check back soon!
                </p>
              </div>
            ) : (
              queries.map((q) => {
                const expertShare = Math.round(q.budget * 0.85 * 100) / 100;

                return (
                  <div
                    key={q.id}
                    className="rounded-3xl bg-white p-6 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-brand-50 text-brand-700 font-bold text-xs px-2.5 py-1">
                            {q.subject}
                          </span>
                          <span className="font-mono text-xs text-slate-400">
                            Ref: {q.id}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            q.urgency === 'URGENT'
                              ? 'bg-rose-100 text-rose-800'
                              : q.urgency === 'HIGH'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            ⚡ {q.urgency} Urgency
                          </span>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold text-emerald-700">
                            {formatGlobalAmount(expertShare, curr)}
                          </div>
                          <span className="text-[10px] text-slate-400 block -mt-0.5">
                            Net Earnings (85% of {formatGlobalAmount(q.budget, curr)})
                          </span>
                        </div>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {q.title}
                      </h3>

                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                        {q.description}
                      </p>

                      {q.attachments && q.attachments.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {q.attachments.map((att, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs text-slate-700 font-medium"
                            >
                              <FileText className="h-3.5 w-3.5 text-brand-600" />
                              <span>{att.name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({att.size})</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50 -mx-6 -mb-6 p-4 rounded-b-3xl">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>Student: <strong className="text-slate-800">{q.studentMaskedName || 'Student (STU-8821)'}</strong></span>
                        <span>•</span>
                        <span>Deadline: <strong className="text-slate-800">{formatDateTime(q.deadline)}</strong></span>
                      </div>

                      <button
                        onClick={() => handleAcceptQuery(q.id)}
                        disabled={acceptingId === q.id}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-50"
                      >
                        {acceptingId === q.id ? (
                          <span>Assigning & Initializing Chat...</span>
                        ) : (
                          <>
                            <span>Accept Assignment & Start Chat</span>
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

      </div>
    </div>
  );
}
