'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Order } from '@/types';
import { formatGlobalAmount } from '@/lib/currencies';
import { formatDateTime } from '@/lib/utils';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  Download,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import OrderLifecycleTracker from '@/components/orders/OrderLifecycleTracker';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => data.success && setOrders(data.orders));
  }, []);

  const totalGMV = orders.reduce((sum, o) => sum + o.amount, 0);
  const totalCommission = orders.reduce((sum, o) => sum + o.platformFee, 0);
  const totalExpertPayouts = orders.reduce((sum, o) => sum + o.expertEarnings, 0);

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-md uppercase tracking-wider">
            Financial Clearinghouse
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Global Escrow Custody & Platform Revenue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Automated multi-currency split: 85% to expert mentors, 15% platform commission cut.
          </p>
        </div>

        {/* Revenue Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl bg-white p-6 border border-slate-200/90 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Student Payments (GMV)
            </span>
            <div className="mt-2 text-3xl font-extrabold text-slate-900">
              {formatGlobalAmount(totalGMV, 'USD')}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Collected across global student orders
            </p>
          </div>

          <div className="rounded-3xl bg-gradient-to-tr from-purple-700 to-indigo-800 text-white p-6 shadow-md shadow-purple-600/20">
            <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider">
              Platform Commission (15%)
            </span>
            <div className="mt-2 text-3xl font-extrabold">
              {formatGlobalAmount(totalCommission, 'USD')}
            </div>
            <p className="text-xs text-purple-200 mt-1">
              Net platform retained revenue
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 border border-slate-200/90 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Expert Payout Allocation (85%)
            </span>
            <div className="mt-2 text-3xl font-extrabold text-emerald-700">
              {formatGlobalAmount(totalExpertPayouts, 'USD')}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Disbursed or locked in escrow
            </p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Active Platform Orders ({orders.length})
            </h3>
            <span className="text-xs text-emerald-700 font-semibold">
              ✓ Automated Real-time Reconciliation
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200/60">
                <tr>
                  <th className="px-5 py-3.5">Order</th>
                  <th className="px-5 py-3.5">Parties (Masked)</th>
                  <th className="px-5 py-3.5">Student Paid</th>
                  <th className="px-5 py-3.5">Platform Fee</th>
                  <th className="px-5 py-3.5">Expert Payout</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Escrow State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-mono font-bold text-slate-900">{ord.orderNumber}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{ord.queryTitle}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-slate-800 font-medium">
                        Student: <span className="font-mono">{ord.studentMaskedId}</span>
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Expert: <span className="font-mono">{ord.expertMaskedId}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {formatGlobalAmount(ord.amount, ord.currency || 'USD')}
                    </td>
                    <td className="px-5 py-4 font-semibold text-purple-700">
                      +{formatGlobalAmount(ord.platformFee, ord.currency || 'USD')}
                    </td>
                    <td className="px-5 py-4 font-bold text-emerald-700">
                      {formatGlobalAmount(ord.expertEarnings, ord.currency || 'USD')}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ord.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'DELIVERED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {ord.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {ord.paymentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
