'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { ExpertProfile } from '@/types';
import { formatGlobalAmount } from '@/lib/currencies';
import {
  Star,
  CheckCircle2,
  ShieldCheck,
  MessageSquare,
  Phone,
  Search,
  Filter,
  Award,
  BookOpen,
} from 'lucide-react';
import MaskedCallModal from '@/components/call/MaskedCallModal';

export default function BrowseExpertsPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { initiateCall } = useSocket();
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [callModalTarget, setCallModalTarget] = useState<ExpertProfile | null>(null);

  useEffect(() => {
    fetch('/api/experts?status=APPROVED')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setExperts(data.experts);
        }
      })
      .catch((err) => console.error('Error fetching approved experts', err));
  }, []);

  const handleStartChatWithExpert = async (expertUserId: string) => {
    try {
      const res = await fetch('/api/chat/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentUser.id,
          expertId: expertUserId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/chat');
      }
    } catch (err) {
      console.error(err);
      router.push('/chat');
    }
  };

  const allSubjects = Array.from(
    new Set(experts.flatMap((exp) => exp.subjects || []))
  );

  const filteredExperts = experts.filter((exp) => {
    const matchesSubject =
      selectedSubject === 'ALL' || exp.subjects.includes(selectedSubject);
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      exp.user?.name.toLowerCase().includes(q) ||
      exp.title.toLowerCase().includes(q) ||
      exp.bio.toLowerCase().includes(q) ||
      exp.subjects.some((s) => s.toLowerCase().includes(q));

    return matchesSubject && matchesSearch;
  });

  const curr = currentUser.currency || 'USD';

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                100% Audited Academic Mentors
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Verified PhD & Master Degrees Worldwide
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
              Find & Collaborate with University Mentors
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Connect via real-time WhatsApp-style chat or masked voice calls. All transactions backed by platform escrow.
            </p>
          </div>

          <Link
            href="/student/submit-query"
            className="self-start md:self-auto rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-700 shadow-md shadow-brand-500/20"
          >
            Post a Custom Problem Set →
          </Link>
        </div>

        {/* Filter & Search Bar */}
        <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by topic (e.g. Econometrics, Machine Learning, Calculus)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-brand-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedSubject('ALL')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedSubject === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Subjects
            </button>
            {allSubjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedSubject === sub
                    ? 'bg-brand-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        {/* Expert Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperts.map((expert) => (
            <div
              key={expert.id}
              className="rounded-3xl bg-white p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between hover:shadow-md hover:border-brand-300 transition-all group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={expert.user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'}
                        alt={expert.user?.name || 'Expert'}
                        className="h-14 w-14 rounded-2xl object-cover ring-2 ring-slate-100 group-hover:ring-brand-400 transition-all"
                      />
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white ring-2 ring-white">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-slate-900">
                          {expert.user?.name}
                        </h3>
                      </div>
                      <span className="font-mono text-[11px] text-slate-400">
                        {expert.user?.maskedId}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-bold text-slate-900">
                      {formatGlobalAmount(expert.hourlyRate, curr)}
                    </span>
                    <span className="block text-[10px] text-slate-400">/ hour</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 mb-3 text-xs">
                  <div className="flex items-center gap-1 font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{expert.rating}</span>
                    <span className="text-slate-400 font-normal">({expert.reviewCount})</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-600 text-[11px] font-medium">
                    {expert.completedTasks} tasks solved
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-slate-800 mb-2 leading-snug">
                  {expert.title}
                </h4>

                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                  {expert.bio}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {expert.subjects.map((sub, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 pt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStartChatWithExpert(expert.userId)}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Real-time Chat</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    initiateCall(expert.userId, currentUser.name);
                    setCallModalTarget(expert);
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  title="Request real-time encrypted masked call"
                >
                  <Phone className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Call</span>
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {callModalTarget && (
        <MaskedCallModal
          isOpen={!!callModalTarget}
          onClose={() => setCallModalTarget(null)}
          callerMaskedName="Student"
          recipientMaskedName={callModalTarget.user?.name || 'Verified Mentor'}
          recipientMaskedId={callModalTarget.user?.maskedId || 'EXP-000'}
          recipientAvatar={callModalTarget.user?.avatar}
        />
      )}
    </div>
  );
}
