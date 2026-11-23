'use client';

import React, { useState } from 'react';
import { Order, PaymentInvoice } from '@/types';
import { formatGlobalAmount } from '@/lib/currencies';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, CheckCircle2, Lock, ArrowRight, CreditCard, Smartphone, Building, Download, FileText, X } from 'lucide-react';

interface PaymentCheckoutModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (invoice: PaymentInvoice) => void;
}

export default function PaymentCheckoutModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: PaymentCheckoutModalProps) {
  const { currentUser } = useAuth();
  const [method, setMethod] = useState<'CARD' | 'UPI' | 'WIRE'>('CARD');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paidInvoice, setPaidInvoice] = useState<PaymentInvoice | null>(null);

  if (!isOpen) return null;

  const baseAmount = order.amount;
  const tax = Math.round(baseAmount * 0.10 * 100) / 100;
  const totalAmount = Math.round((baseAmount + tax) * 100) / 100;
  const curr = order.currency || currentUser.currency || 'USD';

  const handlePay = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: method === 'CARD'
            ? 'Stripe Escrow (Visa / Mastercard / Apple Pay)'
            : method === 'UPI'
            ? 'UPI / Instant Bank Pay'
            : 'International SWIFT / Wire Escrow',
        }),
      });
      const data = await res.json();
      if (data.success && data.invoice) {
        setPaidInvoice(data.invoice);
        onSuccess(data.invoice);
      }
    } catch (err) {
      console.error('Payment error', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {paidInvoice ? 'Payment Authorized' : 'Global Escrow Checkout'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {order.orderNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {paidInvoice ? (
          /* ================= SUCCESS & INVOICE RECEIPT ================= */
          <div className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 animate-bounce">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h4 className="text-xl font-bold text-slate-900">
                Payment Held in Secure Escrow!
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-md">
                Ref: <span className="font-mono font-semibold text-slate-700">{paidInvoice.transactionRef}</span>
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-brand-600" />
                  <span className="text-xs font-bold text-slate-800">
                    TAX INVOICE: {paidInvoice.invoiceNumber}
                  </span>
                </div>
                <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  PAID (ESCROW VAULT)
                </span>
              </div>

              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Assignment Task:</span>
                  <span className="font-semibold text-slate-800 max-w-[240px] truncate">{order.queryTitle}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Assigned Mentor:</span>
                  <span className="font-semibold text-slate-800">{order.expertName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Base Fee:</span>
                  <span>{formatGlobalAmount(paidInvoice.amount, curr)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Platform Fee & Tax:</span>
                  <span>{formatGlobalAmount(paidInvoice.tax, curr)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                  <span>Total Escrow Deposit:</span>
                  <span className="text-brand-700">{formatGlobalAmount(paidInvoice.totalAmount, curr)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>
                Funds are held in secure escrow. The expert has been notified over Socket.io and can begin work immediately.
              </span>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Print Invoice</span>
              </button>
              <button
                onClick={onClose}
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-700 transition-colors shadow-sm"
              >
                Return to Chat
              </button>
            </div>
          </div>
        ) : (
          /* ================= PAYMENT FLOW ================= */
          <div className="p-6">
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 mb-5">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Order Summary
              </div>
              <h4 className="mt-1 text-sm font-bold text-slate-900 leading-snug">
                {order.queryTitle}
              </h4>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-600 border-t border-slate-200/60 pt-2">
                <span>Subject: <strong>{order.subject}</strong></span>
                <span>Mentor: <strong>{order.expertName}</strong></span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="mb-5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 block">
                Select International Payment Gateway
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setMethod('CARD')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                    method === 'CARD'
                      ? 'border-brand-600 bg-brand-50/70 text-brand-700 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <CreditCard className="h-5 w-5 mb-1 text-brand-600" />
                  <span>Stripe / Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('UPI')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                    method === 'UPI'
                      ? 'border-brand-600 bg-brand-50/70 text-brand-700 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Smartphone className="h-5 w-5 mb-1 text-emerald-600" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('WIRE')}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all ${
                    method === 'WIRE'
                      ? 'border-brand-600 bg-brand-50/70 text-brand-700 ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Building className="h-5 w-5 mb-1 text-indigo-600" />
                  <span>Bank Wire</span>
                </button>
              </div>
            </div>

            {/* Price breakdown */}
            <div className="rounded-2xl border border-slate-200 p-4 space-y-2 text-xs bg-slate-50/50">
              <div className="flex justify-between text-slate-600">
                <span>Problem Assignment Fee</span>
                <span>{formatGlobalAmount(baseAmount, curr)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Escrow Protection (10%)</span>
                <span>{formatGlobalAmount(tax, curr)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-slate-900">
                <span>Total Payable:</span>
                <span className="text-brand-700">{formatGlobalAmount(totalAmount, curr)}</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-900 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Platform Escrow Guarantee:</strong> Funds are locked safely in escrow until you approve the delivered work.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handlePay}
                disabled={isProcessing}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-brand-500/25 hover:from-brand-700 hover:to-indigo-700 transition-all active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? (
                  <span>Processing Global Escrow...</span>
                ) : (
                  <>
                    <span>Pay {formatGlobalAmount(totalAmount, curr)} via Escrow</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
