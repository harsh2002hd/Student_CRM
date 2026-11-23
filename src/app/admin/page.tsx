'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Order, ExpertProfile, FlaggedMessageRecord } from '@/types';
import { formatGlobalAmount } from '@/lib/currencies';
import {
  ShieldAlert,
  UserCheck,
  CreditCard,
  Layers,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Users,
  Eye,
  Megaphone,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [pendingExperts, setPendingExperts] = useState<ExpertProfile[]>([]);
  const [flaggedMessages, setFlaggedMessages] = useState<FlaggedMessageRecord[]>([]);

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => data.success && setOrders(data.orders));

    fetch('/api/experts?status=PENDING')
      .then((res) => res.json())
      .then((data) => data.success && setPendingExperts(data.experts));

    fetch('/api/chat/flagged')
      .then((res) => res.json())
      .then((data) => data.success && setFlaggedMessages(data.flaggedMessages));
  }, []);

  const totalGMV = orders.reduce((sum, o) => sum + o.amount, 0);
  const totalCommission = orders.reduce((sum, o) => sum + o.platformFee, 0);

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
              Platform Master Control
            </span>
            <span className="text-xs text-slate-500 font-semibold">
              Global Platform Authority
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
            M1 Company Enterprise Operations & Oversight
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor escrow balances across countries, enforce strict anti-bypass security, authorize expert credentials, and govern advertising campaigns.
          </p>
        </div>

        {/* High-level KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-3xl bg-white p-5 border border-slate-200/90 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Gross Marketplace Volume</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-extrabold text-slate-900">{formatGlobalAmount(totalGMV, 'USD')}</span>
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Cumulative student GMV</span>
          </div>

          <div className="rounded-3xl bg-white p-5 border border-slate-200/90 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Platform 15% Net Cut</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-extrabold text-purple-700">{formatGlobalAmount(totalCommission, 'USD')}</span>
              <CreditCard className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Platform commissions retained</span>
          </div>

          <div className="rounded-3xl bg-white p-5 border border-slate-200/90 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Pending Expert Audits</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-extrabold text-amber-600">{pendingExperts.length}</span>
              <UserCheck className="h-5 w-5 text-amber-500" />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Awaiting qualification verification</span>
          </div>

          <div className="rounded-3xl bg-white p-5 border border-slate-200/90 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Flagged Anti-Bypass Attempts</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-extrabold text-rose-600">{flaggedMessages.length}</span>
              <ShieldAlert className="h-5 w-5 text-rose-500" />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Contact-leak attempts intercepted</span>
          </div>
        </div>

        {/* Action Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="rounded-3xl bg-white p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <UserCheck className="h-5 w-5" />
                </div>
                {pendingExperts.length > 0 && (
                  <span className="rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] px-2.5 py-1">
                    {pendingExperts.length} Needs Review
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Expert Qualification Approval Queue
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Review applicants' academic credentials, degree transcripts, and subjects worldwide. Approve or reject with one click to gate marketplace quality.
              </p>
            </div>

            <Link
              href="/admin/approvals"
              className="mt-6 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-sm"
            >
              <span>Open Approval Queue</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-3xl bg-white p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-rose-100 text-rose-800 font-bold text-[10px] px-2.5 py-1">
                  Active Real-Time Regex
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Anti-Bypass & Contact Leak Oversight
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Inspect messages that attempted to share international phone numbers, emails, or WhatsApp/Telegram handles. Review original vs. redacted strings.
              </p>
            </div>

            <Link
              href="/admin/chat-oversight"
              className="mt-6 flex items-center justify-between rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-sm"
            >
              <span>Inspect Flagged Messages ({flaggedMessages.length})</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-3xl bg-white p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <CreditCard className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-purple-100 text-purple-800 font-bold text-[10px] px-2.5 py-1">
                  Escrow Vault
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Orders, Invoices & Escrow Ledger
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Oversee all ongoing orders, student escrow deposits, expert payouts, and platform tax invoices.
              </p>
            </div>

            <Link
              href="/admin/orders"
              className="mt-6 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-sm"
            >
              <span>View Escrow Ledger</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-3xl bg-white p-6 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center">
                  <Megaphone className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-blue-100 text-brand-800 font-bold text-[10px] px-2.5 py-1">
                  Student Dashboard Banners
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Advertising & Promotional Banner Manager
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Create and toggle promotional cards shown on the student portal. Track impressions and click-through performance.
              </p>
            </div>

            <Link
              href="/admin/ads"
              className="mt-6 flex items-center justify-between rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-sm"
            >
              <span>Manage Promotional Banners</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
