'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { SUPPORTED_COUNTRIES } from '@/lib/currencies';
import AuthModal from '@/components/auth/AuthModal';
import {
  GraduationCap,
  MessageSquare,
  ShieldAlert,
  UserCheck,
  CreditCard,
  Briefcase,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Globe,
  UserPlus,
  LogIn,
  Radio,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, currentRole, expertProfile, allUsers, switchUser, isPendingApproval, refreshUserData } = useAuth();
  const { isConnected } = useSocket();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleResetDb = async () => {
    if (confirm('Reset platform data to initial state?')) {
      await fetch('/api/reset', { method: 'POST' });
      await refreshUserData();
      window.location.reload();
    }
  };

  const handleCurrencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurr = e.target.value;
    try {
      await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, currency: newCurr }),
      });
      await refreshUserData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      
      {/* ================= TOP DEV BAR & REAL-TIME SOCKET STATUS ================= */}
      <div className="bg-slate-900 text-white px-4 py-1.5 text-xs">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          
          <div className="flex items-center gap-2">
            <span className={`flex h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="font-semibold text-slate-300">
              {isConnected ? 'SOCKET.IO LIVE' : 'CONNECTING...'}
            </span>
            <span className="hidden sm:inline text-slate-400">• Multi-Country Academic Network</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Quick actor pills */}
            {mounted && (() => {
              const list = [...(allUsers || [])];
              if (currentUser?.id && !list.slice(0, 5).some((u) => u.id === currentUser.id)) {
                const idx = list.findIndex((u) => u.id === currentUser.id);
                if (idx > -1) {
                  const [curr] = list.splice(idx, 1);
                  list.unshift(curr);
                }
              }
              return list.slice(0, 6).map((user) => {
                const isSelected = user.id === currentUser?.id;
                let roleBadge = 'bg-blue-900/60 text-blue-300 border-blue-700/50';
                let emoji = '👨‍🎓';
                if (user.role === 'ADMIN') {
                  roleBadge = 'bg-purple-900/60 text-purple-300 border-purple-700/50';
                  emoji = '🛡️';
                } else if (user.role === 'EXPERT') {
                  roleBadge = user.id === 'usr_exp_pending'
                    ? 'bg-amber-900/60 text-amber-300 border-amber-700/50'
                    : 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50';
                  emoji = '👨‍🏫';
                }

                return (
                  <button
                    key={user.id}
                    onClick={() => {
                      switchUser(user.id);
                      if (user.role === 'ADMIN') router.push('/admin');
                      else if (user.role === 'EXPERT') router.push('/expert');
                      else router.push('/student');
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all border ${
                      isSelected
                        ? 'bg-white text-slate-900 border-white shadow-sm font-semibold scale-102'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span>{(user.name || 'User').split(' ')[0]}</span>
                    <span className={`text-[10px] px-1 rounded uppercase tracking-wider ${roleBadge}`}>
                      {user.id === 'usr_exp_pending' ? 'Pending' : user.role}
                    </span>
                  </button>
                );
              });
            })()}

            {/* Custom Register button */}
            <button
              onClick={() => {
                setAuthModalTab('REGISTER');
                setIsAuthModalOpen(true);
              }}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-md text-xs font-bold transition-all shadow-xs ml-1"
            >
              <UserPlus className="h-3 w-3" />
              <span>+ Direct Register</span>
            </button>

            <button
              onClick={handleResetDb}
              title="Reset sample data"
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-300 px-2 py-1 rounded hover:bg-slate-800 transition-colors ml-1"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= MAIN NAVIGATION ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link
              href={currentRole === 'ADMIN' ? '/admin' : currentRole === 'EXPERT' ? '/expert' : '/student'}
              className="flex items-center gap-2.5 group"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
                  M1 Company <span className="text-brand-600 font-extrabold">CRM</span>
                </span>
                <span className="text-[10px] font-medium text-slate-500 -mt-1 tracking-wide uppercase">
                  Global Student–Expert Network
                </span>
              </div>
            </Link>

            {/* Role Nav Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {currentRole === 'STUDENT' && (
                <>
                  <Link
                    href="/student"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname === '/student'
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/student/submit-query"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/student/submit-query')
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Post Problem / Query
                  </Link>
                  <Link
                    href="/student/experts"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/student/experts')
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Find Verified Mentors
                  </Link>
                  <Link
                    href="/student/history"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/student/history')
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Orders & Invoices
                  </Link>
                </>
              )}

              {currentRole === 'EXPERT' && (
                <>
                  <Link
                    href="/expert"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname === '/expert'
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/expert/queries"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/expert/queries')
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Query Feed
                  </Link>
                  <Link
                    href="/expert/orders"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/expert/orders')
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Active Tasks & Delivery
                  </Link>
                  <Link
                    href="/expert/earnings"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/expert/earnings')
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Earnings & Payouts
                  </Link>
                </>
              )}

              {currentRole === 'ADMIN' && (
                <>
                  <Link
                    href="/admin"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname === '/admin'
                        ? 'bg-purple-50 text-purple-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Overview
                  </Link>
                  <Link
                    href="/admin/approvals"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/admin/approvals')
                        ? 'bg-purple-50 text-purple-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>Expert Approvals</span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white font-bold">
                      1
                    </span>
                  </Link>
                  <Link
                    href="/admin/chat-oversight"
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/admin/chat-oversight')
                        ? 'bg-purple-50 text-purple-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldAlert className="h-4 w-4 text-rose-500" />
                    <span>Anti-Bypass Oversight</span>
                  </Link>
                  <Link
                    href="/admin/orders"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/admin/orders')
                        ? 'bg-purple-50 text-purple-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Escrow Vault
                  </Link>
                  <Link
                    href="/admin/ads"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith('/admin/ads')
                        ? 'bg-purple-50 text-purple-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Ad Banners
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            
            {/* Global Currency Selector */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100 rounded-xl px-2 py-1 text-xs">
              <Globe className="h-3.5 w-3.5 text-slate-500" />
              <select
                value={currentUser?.currency || 'USD'}
                onChange={handleCurrencyChange}
                className="bg-transparent text-xs font-bold text-slate-800 border-none focus:outline-hidden cursor-pointer"
              >
                {SUPPORTED_COUNTRIES.map((c) => (
                  <option key={c.currency} value={c.currency}>
                    {c.currency} ({c.currencySymbol})
                  </option>
                ))}
              </select>
            </div>

            {/* Real-time WhatsApp-Style Chat Button */}
            <Link
              href="/chat"
              className="relative flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-all active:scale-95"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">WhatsApp Chat</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-300 animate-ping absolute -top-1 -right-1" />
            </Link>

            {/* Active User Avatar */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="relative">
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={currentUser?.name || 'User'}
                  className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-100"
                />
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser?.name || 'User'}
                  </span>
                  {expertProfile?.approvalStatus === 'APPROVED' && (
                    <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                  <span>{currentUser?.maskedId || 'USR-0000'}</span>
                  <span>•</span>
                  <span className="capitalize">{currentUser?.role ? currentUser.role.toLowerCase() : 'student'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approval Alert Banner for Gated Experts */}
      {currentRole === 'EXPERT' && isPendingApproval && (
        <div className="bg-amber-500 text-white px-4 py-2 text-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-100" />
              <span className="font-semibold">Account Pending Verification:</span>
              <span>Your academic credentials are being audited. Query feed and chat access will unlock as soon as Admin approves.</span>
            </div>
            <button
              onClick={() => {
                switchUser('usr_admin');
                router.push('/admin/approvals');
              }}
              className="bg-slate-900 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-slate-800 transition-colors shrink-0 ml-4 shadow-sm"
            >
              Switch to Admin to Approve →
            </button>
          </div>
        </div>
      )}

      {/* Global Registration / Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultTab={authModalTab}
      />
    </header>
  );
}
