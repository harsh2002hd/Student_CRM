'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Order, PaymentInvoice } from '@/types';
import { formatGlobalAmount } from '@/lib/currencies';
import { formatDateTime } from '@/lib/utils';
import {
  FileText,
  Download,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export default function StudentHistoryPage() {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentInvoice | null>(null);

  useEffect(() => {
    fetch(`/api/orders?studentId=${currentUser.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setOrders(data.orders);
        }
      })
      .catch((err) => console.error('Error fetching orders', err));
  }, [currentUser]);

  const fetchInvoice = async (invoiceId: string) => {
    try {
      const ordersRes = await fetch(`/api/orders?studentId=${currentUser.id}`);
      const data = await ordersRes.json();
      const matched = data.orders.find((o: Order) => o.invoiceId === invoiceId);
      if (matched) {
        const invRes = await fetch(`/api/orders/${matched.id}`);
        const invData = await invRes.json();
        if (invData.invoice) setSelectedInvoice(invData.invoice);
      }
    } catch (err) {
      console.error('Invoice error', err);
    }
  };

  const curr = currentUser.currency || 'USD';

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
            Account Records
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Order History & Payment Invoices
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Audit your assignment transactions, deliverables, and official tax receipts in {curr}.
          </p>
        </div>

        {/* Orders Table */}
        <div className="rounded-3xl bg-white border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700">
              All Orders ({orders.length})
            </h3>
            <span className="text-xs text-slate-500">
              Escrow Protected Platform
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200/60">
                <tr>
                  <th className="px-5 py-3.5">Order Ref</th>
                  <th className="px-5 py-3.5">Problem Title</th>
                  <th className="px-5 py-3.5">Expert Mentor</th>
                  <th className="px-5 py-3.5">Fee</th>
                  <th className="px-5 py-3.5">Lifecycle Status</th>
                  <th className="px-5 py-3.5">Invoice</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
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
                    <td className="px-5 py-4">
                      <span className="font-medium text-slate-800">{ord.expertName}</span>
                      <span className="block font-mono text-[10px] text-slate-400">
                        {ord.expertMaskedId}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {formatGlobalAmount(ord.amount, curr)}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        ord.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'DELIVERED'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {ord.status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3" />}
                        {ord.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {ord.invoiceId ? (
                        <button
                          onClick={() => fetchInvoice(ord.invoiceId!)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-800 underline"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>View Invoice</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Pending Escrow</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href="/chat"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1 rounded-lg transition-colors"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span>Chat</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Invoice Modal Preview */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Tax Invoice {selectedInvoice.invoiceNumber}
                </h3>
                <p className="text-xs text-slate-500">
                  M1 Company • Registered Global Escrow
                </p>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="my-5 space-y-3 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Order Reference:</span>
                <span className="font-mono font-bold text-slate-800">{selectedInvoice.orderNumber}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Transaction Ref:</span>
                <span className="font-mono text-slate-700">{selectedInvoice.transactionRef}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Method:</span>
                <span className="font-semibold text-slate-800">{selectedInvoice.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Base Amount:</span>
                <span>{formatGlobalAmount(selectedInvoice.amount, curr)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Escrow Fee (10%):</span>
                <span>{formatGlobalAmount(selectedInvoice.tax, curr)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                <span>Total Amount Paid:</span>
                <span className="text-brand-600">{formatGlobalAmount(selectedInvoice.totalAmount, curr)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
