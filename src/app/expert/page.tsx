'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Order, StudentQuery } from '@/types';
import { formatGlobalAmount } from '@/lib/currencies';
import { formatDateTime } from '@/lib/utils';
import {
  Briefcase,
  Clock,
  TrendingUp,
  Award,
  Star,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  FileText,
  Upload,
} from 'lucide-react';

export default function ExpertDashboard() {
  const { currentUser, expertProfile, isPendingApproval, switchUser } = useAuth();
  const { lastFinancialUpdate, lastOrderUpdate } = useSocket();
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [openQueriesCount, setOpenQueriesCount] = useState(0);

  const loadExpertData = () => {
    if (!isPendingApproval && currentUser?.id) {
      fetch(`/api/orders?expertId=${currentUser.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setActiveOrders(data.orders.filter((o: Order) => o.status !== 'COMPLETED'));
          }
        })
        .catch((err) => console.error(err));

      fetch('/api/queries?forExperts=true')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setOpenQueriesCount(data.queries.length);
          }
        })
        .catch((err) => console.error(err));
    }
  };

  useEffect(() => {
    loadExpertData();
  }, [currentUser, isPendingApproval]);

  // Real-time refresh when Socket.io signals updates
  useEffect(() => {
    if (lastFinancialUpdate || lastOrderUpdate) {
      loadExpertData();
    }
  }, [lastFinancialUpdate, lastOrderUpdate]);

  const curr = currentUser.currency || 'USD';

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* GATED PENDING APPROVAL WARNING */}
        {isPendingApproval && (
          <div className="rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-8 shadow-xl">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-xs">
                <AlertTriangle className="h-4 w-4" />
                <span>Academic Verification Underway</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Your Expert Account is in "Pending Approval" State
              </h2>
              <p className="text-xs sm:text-sm text-amber-100 leading-relaxed">
                To guarantee academic integrity and student safety across countries, every mentor profile must be explicitly verified by the Platform Admin. Query feeds and WhatsApp chat will unlock upon verification.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    switchUser('usr_admin');
                    window.location.href = '/admin/approvals';
                  }}
                  className="rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-md"
                >
                  Switch to Admin & 1-Click Approve This Profile →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Header */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'}
              alt={currentUser?.name || 'Expert'}
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl object-cover ring-4 ring-slate-100 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  {currentUser?.name || 'Academic Mentor'}
                </h1>
                {expertProfile?.approvalStatus === 'APPROVED' ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified Academic Mentor</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Pending Approval
                  </span>
                )}
              </div>

              <p className="text-xs font-semibold text-slate-700 mt-1">
                {expertProfile?.title}
              </p>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  {currentUser?.maskedId}
                </span>
                <span>•</span>
                <span>{expertProfile?.qualifications}</span>
                <span>•</span>
                <span className="font-bold text-slate-800">
                  Rate: {formatGlobalAmount(expertProfile?.hourlyRate || 35, curr)}/hr
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/expert/queries"
              className={`flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-700 shadow-md shadow-brand-500/20 transition-all ${
                isPendingApproval ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              <Briefcase className="h-4 w-4" />
              <span>Query Feed ({openQueriesCount})</span>
            </Link>

            <Link
              href="/chat"
              className={`flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all ${
                isPendingApproval ? 'pointer-events-none opacity-40' : ''
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>WhatsApp Chat</span>
            </Link>
          </div>
        </div>

        {/* Real-time Earnings Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Cleared Balance</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-emerald-700">
                {formatGlobalAmount(expertProfile?.totalEarnings || 0, curr)}
              </span>
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Live balance</span>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Held in Escrow</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-slate-900">
                {formatGlobalAmount(expertProfile?.pendingBalance || 0, curr)}
              </span>
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Pending delivery confirmation</span>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Completed Orders</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-slate-900">
                {expertProfile?.completedTasks || 0}
              </span>
              <Award className="h-5 w-5 text-brand-600" />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Rating</span>
            <div className="flex items-baseline justify-between mt-2">
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold text-slate-900">{expertProfile?.rating || 5.0}</span>
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              </div>
              <span className="text-xs text-slate-400">({expertProfile?.reviewCount} reviews)</span>
            </div>
          </div>
        </div>

        {/* Active Tasks Table */}
        <div className="rounded-3xl bg-white border border-slate-200/80 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Active Assigned Tasks & Deadlines
              </h2>
              <p className="text-xs text-slate-500">
                Deliver final solutions directly in chat to release funds from escrow.
              </p>
            </div>
            <Link
              href="/expert/orders"
              className="text-xs font-semibold text-brand-600 hover:text-brand-800"
            >
              Task Manager →
            </Link>
          </div>

          {isPendingApproval ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
              Access to student queries and assigned tasks is locked while under review.
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-2xl">
              No active tasks assigned right now. Browse the Query Feed to accept new student problems!
            </div>
          ) : (
            <div className="space-y-3">
              {activeOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="rounded-2xl border border-slate-200/80 p-4 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {ord.orderNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {ord.queryTitle}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ord.status === 'DELIVERED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {ord.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-500">
                      <span>Student: <strong>{ord.studentMaskedId}</strong> (Contact Protected)</span>
                      <span>•</span>
                      <span>Deadline: <strong>{formatDateTime(ord.deadline)}</strong></span>
                      <span>•</span>
                      <span>Your Net Share: <strong className="text-emerald-700">{formatGlobalAmount(ord.expertEarnings, curr)}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/chat"
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>Open Chat & Deliver</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
