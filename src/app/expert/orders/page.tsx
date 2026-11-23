'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Order } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import {
  FileText,
  Upload,
  MessageSquare,
  CheckCircle2,
  Clock,
  Award,
  Download,
  AlertCircle,
  X,
} from 'lucide-react';
import OrderLifecycleTracker from '@/components/orders/OrderLifecycleTracker';

export default function ExpertOrdersPage() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveringOrder, setDeliveringOrder] = useState<Order | null>(null);
  const [deliveryNote, setDeliveryNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOrders = async () => {
    try {
      const res = await fetch(`/api/orders?expertId=${currentUser.id}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Error fetching expert orders', err);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentUser]);

  const handleDeliverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveringOrder) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${deliveringOrder.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file: {
            name: `${deliveringOrder.subject.replace(/\s+/g, '_')}_Verified_Solution_Final.pdf`,
            size: '2.1 MB',
            url: '/mock-files/Calculus_Lagrange_Ellipsoid_Extrema_Final.pdf',
            note: deliveryNote || 'All derivations and mathematical proofs verified.',
          },
          deliveryNote,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDeliveringOrder(null);
        setDeliveryNote('');
        loadOrders();
      }
    } catch (err) {
      console.error('Delivery submit error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">
            Mentor Workspace
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Active Tasks, Deadlines & Final File Delivery
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Deliver final assignment solutions to unlock student approvals and release escrow earnings.
          </p>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {orders.map((ord) => (
            <div
              key={ord.id}
              className="rounded-3xl bg-white p-6 border border-slate-200/90 shadow-xs space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {ord.orderNumber}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Subject: <strong className="text-slate-800">{ord.subject}</strong>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      ord.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : ord.status === 'DELIVERED'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      ● {ord.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1.5">
                    {ord.queryTitle}
                  </h3>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-700">
                    {formatCurrency(ord.expertEarnings)}
                  </div>
                  <span className="text-[10px] text-slate-400 block -mt-0.5">
                    Your Share (85%)
                  </span>
                </div>
              </div>

              {/* Progress tracker */}
              <div className="px-2 py-1">
                <OrderLifecycleTracker status={ord.status} />
              </div>

              {/* Delivered Files Preview if any */}
              {ord.deliveryFiles && ord.deliveryFiles.length > 0 && (
                <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 mb-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Delivered Solution Files</span>
                  </div>
                  <div className="space-y-2">
                    {ord.deliveryFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl bg-white p-2.5 text-xs border border-emerald-100"
                      >
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-emerald-600" />
                          <span className="font-semibold text-slate-800">{f.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({f.size})</span>
                        </div>
                        <a
                          href={f.url}
                          download
                          className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="text-xs text-slate-500">
                  Student: <strong className="text-slate-800">{ord.studentMaskedId}</strong> • Deadline: <strong className="text-slate-800">{formatDateTime(ord.deadline)}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href="/chat"
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />
                    <span>WhatsApp Chat</span>
                  </Link>

                  {ord.status !== 'COMPLETED' && (
                    <button
                      onClick={() => setDeliveringOrder(ord)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{ord.status === 'DELIVERED' ? 'Upload Updated Revision' : 'Deliver Final Solution'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Deliver Solution Modal */}
      {deliveringOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <button
              onClick={() => setDeliveringOrder(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900">
              Deliver Solution for {deliveringOrder.orderNumber}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {deliveringOrder.queryTitle}
            </p>

            <form onSubmit={handleDeliverSubmit} className="mt-4 space-y-4">
              <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 p-6 text-center">
                <FileText className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  {deliveringOrder.subject.replace(/\s+/g, '_')}_Final_Solution.pdf
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Ready to attach & send to student in chat (2.1 MB)
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Deliverable Notes & Explanations:
                </label>
                <textarea
                  required
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  placeholder="Explain how you solved the problem, step-by-step logic, tools used, and any instructions for the student..."
                  className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-3 focus:outline-brand-500 min-h-[90px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeliveringOrder(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Uploading & Sending...' : 'Submit Deliverable'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
