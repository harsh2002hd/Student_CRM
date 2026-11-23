'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Order } from '@/types';
import { formatGlobalAmount } from '@/lib/currencies';
import { formatDateTime } from '@/lib/utils';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Building,
  CreditCard,
  Download,
  ShieldCheck,
  ArrowUpRight,
} from 'lucide-react';

export default function ExpertEarningsPage() {
  const { currentUser, expertProfile, refreshUserData } = useAuth();
  const { lastFinancialUpdate } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [payoutRequested, setPayoutRequested] = useState(false);

  const loadOrders = () => {
    fetch(`/api/orders?expertId=${currentUser.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrders(data.orders);
        }
      })
      .catch((err) => console.error(err));
  };

  useEffect(() => {
    loadOrders();
  }, [currentUser]);

  useEffect(() => {
    if (lastFinancialUpdate) {
      loadOrders();
    }
  }, [lastFinancialUpdate]);

  const curr = currentUser.currency || 'USD';
  const totalEarnings = expertProfile?.totalEarnings || 0;
  const pendingBalance = expertProfile?.pendingBalance || 0;

  const handleRequestPayout = () => {
    if (totalEarnings === 0 && pendingBalance === 0) {
      alert('No available cleared balance to withdraw.');
      return;
    }
    setPayoutRequested(true);
    setTimeout(() => {
      alert(`Payout request of ${formatGlobalAmount(totalEarnings, curr)} successfully initiated via international SWIFT transfer.`);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
              Financial Ledger
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Global Earnings & Escrow Payouts
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Review your 85% revenue share, escrow clearance timeline, and direct bank transfers.
            </p>
          </div>

          <button
            onClick={handleRequestPayout}
            className="self-start md:self-auto rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-all shadow-sm flex items-center gap-1.5"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Request Wire Transfer ({curr})</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white p-6 shadow-md shadow-emerald-600/20">
            <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
              Cleared & Available Balance
            </span>
            <div className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight">
              {formatGlobalAmount(totalEarnings, curr)}
            </div>
            <p className="text-xs text-emerald-100/90 mt-2">
              Ready for immediate withdrawal to your verified account.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 border border-slate-200/90 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Held in Active Escrow
            </span>
            <div className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              {formatGlobalAmount(pendingBalance, curr)}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Will be credited upon student delivery confirmation.
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 border border-slate-200/90 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Commission Take-Rate
            </span>
            <div className="mt-2 text-3xl sm:text-4xl font-extrabold tracking-tight text-brand-600">
              85% / 15%
            </div>
            <p className="text-xs text-slate-500 mt-2">
              You keep 85% of every order amount.
            </p>
          </div>
        </div>

        {/* Remittance Ledger */}
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              Order Remittance Ledger
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              Real-time automatic splits in {curr}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200/60">
                <tr>
                  <th className="px-5 py-3.5">Order Ref</th>
                  <th className="px-5 py-3.5">Assignment</th>
                  <th className="px-5 py-3.5">Gross Order</th>
                  <th className="px-5 py-3.5">Platform Fee (15%)</th>
                  <th className="px-5 py-3.5">Your Payout (85%)</th>
                  <th className="px-5 py-3.5">Payment State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-slate-800">
                      {ord.orderNumber}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 max-w-xs truncate">
                        {ord.queryTitle}
                      </div>
                      <span className="text-[11px] text-slate-500">{ord.subject}</span>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {formatGlobalAmount(ord.amount, curr)}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      -{formatGlobalAmount(ord.platformFee, curr)}
                    </td>
                    <td className="px-5 py-4 font-bold text-emerald-700">
                      {formatGlobalAmount(ord.expertEarnings, curr)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ord.paymentStatus === 'RELEASED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ord.paymentStatus === 'RELEASED' ? 'CLEARED' : 'HELD IN ESCROW'}
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
