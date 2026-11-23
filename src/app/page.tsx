'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/auth/AuthModal';
import {
  GraduationCap,
  Briefcase,
  ShieldAlert,
  ShieldCheck,
  MessageSquare,
  CreditCard,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Phone,
  Megaphone,
  UserPlus,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { currentUser, currentRole, switchUser } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 border border-brand-200/80 px-4 py-1.5 text-xs font-bold text-brand-700 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-brand-600" />
            <span>M1 Company Platform • Enterprise Production Build</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            M1 Company <br />
            <span className="bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Student–Expert Marketplace CRM
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Combining a student doubt-clearing marketplace, WhatsApp-style real-time messaging, zero-contact leakage anti-bypass security, escrow payments, and promotional ad banners.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={currentRole === 'ADMIN' ? '/admin' : currentRole === 'EXPERT' ? '/expert' : '/student'}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/25 hover:from-brand-700 hover:to-indigo-700 transition-all active:scale-95"
            >
              <span>Launch {currentRole} Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
            >
              <MessageSquare className="h-4 w-4" />
              <span>WhatsApp Chat Thread</span>
            </Link>
          </div>
        </div>

        {/* 3 Portal Role Launchpads */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Student Portal */}
          <div className="rounded-3xl bg-white p-8 border border-slate-200/90 shadow-md shadow-slate-200/50 flex flex-col justify-between hover:border-brand-400 transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Role: Student
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Student Portal
              </h2>

              <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Post assignment queries & code problems</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Browse & match with audited PhD/Masters mentors</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Interactive 5-stage Visual Order Tracker</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Razorpay Mock Escrow checkout & GST Invoices</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Post-delivery 5-star rating & reviews</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 flex flex-col gap-2">
              <button
                onClick={() => {
                  const targetStudent = currentUser.role === 'STUDENT' ? currentUser : allUsers.find((u) => u.role === 'STUDENT');
                  if (targetStudent) switchUser(targetStudent.id);
                  router.push('/student');
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-xs"
              >
                <span>
                  Enter as Student ({currentUser.role === 'STUDENT' ? currentUser.name : (allUsers.find((u) => u.role === 'STUDENT')?.name || 'Student Portal')}) →
                </span>
              </button>
              <button
                onClick={() => setIsAuthOpen(true)}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5 text-emerald-600" />
                <span>+ Direct Register Any Student</span>
              </button>
            </div>
          </div>

          {/* Card 2: Expert Portal */}
          <div className="rounded-3xl bg-white p-8 border border-slate-200/90 shadow-md shadow-slate-200/50 flex flex-col justify-between hover:border-emerald-400 transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Briefcase className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Role: Expert Mentor
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Expert Portal
              </h2>

              <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Academic profile with subject & rate specs</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span><strong>Admin Approval Gate:</strong> Gated until verified</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Query marketplace feed (student contacts masked)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Deliver solution files directly in chat</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>85% earnings ledger & direct bank withdrawals</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 flex flex-col gap-2">
              <button
                onClick={() => {
                  switchUser('usr_exp_1');
                  router.push('/expert');
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-700 transition-colors shadow-xs"
              >
                <span>Switch to Approved Expert (Dr. Marcus) →</span>
              </button>
              <button
                onClick={() => {
                  switchUser('usr_exp_pending');
                  router.push('/expert');
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors"
              >
                <span>Test Gated Pending Expert (Elena) →</span>
              </button>
            </div>
          </div>

          {/* Card 3: Admin Console */}
          <div className="rounded-3xl bg-white p-8 border border-slate-200/90 shadow-md shadow-slate-200/50 flex flex-col justify-between hover:border-purple-400 transition-all group">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="h-12 w-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Role: Platform Admin
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900">
                Admin Panel
              </h2>

              <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span><strong>1-Click Expert Approvals</strong> & degree verification</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span><strong>Chat Anti-Bypass Oversight:</strong> Inspect leak logs</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Platform escrow ledger & 15% revenue cut tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span><strong>Ad Banner Manager:</strong> Create & toggle student ads</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                switchUser('usr_admin');
                router.push('/admin');
              }}
              className="mt-8 w-full flex items-center justify-center gap-2 rounded-xl bg-purple-700 py-3 text-xs font-bold text-white hover:bg-purple-800 transition-colors shadow-xs"
            >
              <span>Switch to Admin (Platform Owner) →</span>
            </button>
          </div>

        </div>

        {/* Feature Highlights Grid */}
        <div className="mt-20 border-t border-slate-200/80 pt-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-slate-900">
              Core Architectural Pillars Built-In
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Engineered strictly to satisfy every production and privacy specification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
            <div className="rounded-2xl bg-white p-5 border border-slate-200/80">
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                <Lock className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                Zero Contact Leakage
              </h4>
              <p className="text-slate-500 leading-relaxed">
                Counterparties never see raw phone numbers, email addresses, or handles in API responses or UI. Identifiers are masked as STU-8821 / EXP-101.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 border border-slate-200/80">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                In-Chat Anti-Bypass
              </h4>
              <p className="text-slate-500 leading-relaxed">
                Real-time regex filters automatically detect, block, and sanitize 10-digit numbers, +91 codes, emails, and external links with polite alerts.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 border border-slate-200/80">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                WhatsApp Chat & Call
              </h4>
              <p className="text-slate-500 leading-relaxed">
                Split-pane layout, double blue read ticks, assignment attachments, pinned order status bar, and simulated masked encrypted WebRTC audio calls.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 border border-slate-200/80">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-brand-600 flex items-center justify-center mb-3">
                <Megaphone className="h-5 w-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">
                Advertising Manager
              </h4>
              <p className="text-slate-500 leading-relaxed">
                Full promotional banner CRUD and live toggling with impressions and clicks analytics rendered across student dashboards.
              </p>
            </div>
          </div>
        </div>

      </div>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultTab="REGISTER"
      />

    </div>
  );
}
