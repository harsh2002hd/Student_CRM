'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Order, StudentQuery, PaymentInvoice } from '@/types';
import { formatGlobalAmount } from '@/lib/currencies';
import { formatDateTime } from '@/lib/utils';
import AdBannerCarousel from '@/components/ads/AdBannerCarousel';
import OrderLifecycleTracker from '@/components/orders/OrderLifecycleTracker';
import PaymentCheckoutModal from '@/components/orders/PaymentCheckoutModal';
import RatingModal from '@/components/orders/RatingModal';
import {
  PlusCircle,
  MessageSquare,
  Clock,
  ShieldCheck,
  CreditCard,
  Award,
  FileText,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Globe,
} from 'lucide-react';

export default function StudentDashboard() {
  const { currentUser } = useAuth();
  const { lastFinancialUpdate, lastOrderUpdate } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [queries, setQueries] = useState<StudentQuery[]>([]);
  const [activeOrderForPay, setActiveOrderForPay] = useState<Order | null>(null);
  const [activeOrderForRate, setActiveOrderForRate] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [resOrd, resQry] = await Promise.all([
        fetch(`/api/orders?studentId=${currentUser.id}`),
        fetch(`/api/queries?studentId=${currentUser.id}`),
      ]);
      const dataOrd = await resOrd.json();
      const dataQry = await resQry.json();
      if (dataOrd.success) setOrders(dataOrd.orders);
      if (dataQry.success) setQueries(dataQry.queries);
    } catch (err) {
      console.error('Error fetching student dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Real-time update when Socket.io signals financial or order changes
  useEffect(() => {
    if (lastFinancialUpdate || lastOrderUpdate) {
      loadData();
    }
  }, [lastFinancialUpdate, lastOrderUpdate]);

  const activeOrders = orders.filter((o) => o.status !== 'COMPLETED');
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
  const curr = currentUser.currency || 'USD';

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        
        {/* ================= TOP PROMOTIONAL AD BANNER CAROUSEL ================= */}
        <AdBannerCarousel />

        {/* ================= WELCOME & QUICK METRICS ================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                Student Workspace
              </span>
              <span className="text-xs font-mono text-slate-500">
                ID: {currentUser.maskedId}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                • Currency: {curr}
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Welcome back, {currentUser.name.split(' ')[0]} 👋
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Collaborate safely in real-time with verified academic mentors worldwide.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/student/submit-query"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/20 hover:from-brand-700 hover:to-indigo-700 transition-all active:scale-95"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Post New Problem</span>
            </Link>

            <Link
              href="/chat"
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
            >
              <MessageSquare className="h-4 w-4" />
              <span>WhatsApp Chat</span>
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Active Tasks</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-slate-900">{activeOrders.length}</span>
              <span className="text-xs text-brand-600 font-semibold bg-brand-50 px-2 py-0.5 rounded">Live Orders</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Escrow Protected</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-emerald-700">
                {formatGlobalAmount(activeOrders.reduce((sum, o) => sum + o.amount, 0), curr)}
              </span>
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Completed Solutions</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-2xl font-bold text-slate-900">{completedOrders.length}</span>
              <Award className="h-5 w-5 text-amber-500" />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-xs">
            <span className="text-xs font-medium text-slate-500">Global Privacy Shield</span>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-sm font-bold text-slate-800">100% Masked</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">Zero Leaks</span>
            </div>
          </div>
        </div>

        {/* ================= ACTIVE ORDERS & LIFECYCLE TRACKER ================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Active Orders & Service Status Tracker
              </h2>
              <p className="text-xs text-slate-500">
                Real-time milestone sync from assignment to delivery and escrow clearance.
              </p>
            </div>
            <Link
              href="/student/history"
              className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
            >
              <span>View Past History</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {activeOrders.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <Clock className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No active orders right now</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Have an upcoming assignment or concept doubt? Post a problem to match with a top verified expert within minutes.
              </p>
              <Link
                href="/student/submit-query"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 shadow-sm"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Post Query Now</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl bg-white p-6 border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {order.orderNumber}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          Subject: <strong className="text-slate-800">{order.subject}</strong>
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          order.status === 'DELIVERED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          ● {order.status.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1.5">
                        {order.queryTitle}
                      </h3>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">
                        {formatGlobalAmount(order.amount, curr)}
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                        order.paymentStatus === 'ESCROW_HELD'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {order.paymentStatus === 'ESCROW_HELD' ? '🔒 Escrow Locked' : '⚠️ Payment Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="my-6 px-2">
                    <OrderLifecycleTracker status={order.status} />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4 bg-slate-50/50 -mx-6 -mb-6 p-4 rounded-b-2xl">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs font-bold">
                        👨‍🏫
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <span>{order.expertName}</span>
                          <span className="text-[10px] text-emerald-600 font-mono">({order.expertMaskedId})</span>
                        </div>
                        <p className="text-[10px] text-slate-500">
                          Deadline: {formatDateTime(order.deadline)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href="/chat"
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Chat Thread</span>
                      </Link>

                      {order.paymentStatus === 'PENDING' && (
                        <button
                          onClick={() => setActiveOrderForPay(order)}
                          className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 transition-all shadow-sm"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>Pay Escrow ({formatGlobalAmount(order.amount, curr)})</span>
                        </button>
                      )}

                      {order.status === 'DELIVERED' && (
                        <button
                          onClick={() => setActiveOrderForRate(order)}
                          className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-sm"
                        >
                          <Award className="h-3.5 w-3.5" />
                          <span>Review & Release Payment</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= COMPLETED ARCHIVE PREVIEW ================= */}
        {completedOrders.length > 0 && (
          <div className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Recently Completed & Delivered Work</span>
            </h3>

            <div className="divide-y divide-slate-100">
              {completedOrders.map((order) => (
                <div key={order.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <h4 className="font-bold text-slate-800">{order.queryTitle}</h4>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Solved by {order.expertName} • Order #{order.orderNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{formatGlobalAmount(order.amount, curr)}</span>
                    <Link
                      href="/student/history"
                      className="text-brand-600 hover:text-brand-800 font-semibold text-xs ml-2"
                    >
                      View Invoice →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {activeOrderForPay && (
        <PaymentCheckoutModal
          order={activeOrderForPay}
          isOpen={!!activeOrderForPay}
          onClose={() => setActiveOrderForPay(null)}
          onSuccess={() => {
            setActiveOrderForPay(null);
            loadData();
          }}
        />
      )}

      {activeOrderForRate && (
        <RatingModal
          order={activeOrderForRate}
          isOpen={!!activeOrderForRate}
          onClose={() => setActiveOrderForRate(null)}
          onRated={() => {
            setActiveOrderForRate(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
