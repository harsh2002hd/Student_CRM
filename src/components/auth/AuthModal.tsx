'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { SUPPORTED_COUNTRIES } from '@/lib/currencies';
import { UserRole } from '@/types';
import {
  X,
  User,
  Globe,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'REGISTER' | 'SWITCH';
}

export default function AuthModal({ isOpen, onClose, defaultTab = 'REGISTER' }: AuthModalProps) {
  const router = useRouter();
  const { allUsers, currentUser, switchUser, refreshUserData } = useAuth();
  const [tab, setTab] = useState<'REGISTER' | 'SWITCH'>(defaultTab);

  // Direct Registration Form (NO EMAIL / NO PASSWORD)
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('STUDENT');
  const [countryCode, setCountryCode] = useState('US');
  const [initialMessage, setInitialMessage] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedCountry = SUPPORTED_COUNTRIES.find((c) => c.code === countryCode) || SUPPORTED_COUNTRIES[0];

  const handleDirectRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter your full name or nickname.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const firstMsg = initialMessage.trim() || (
      role === 'STUDENT'
        ? `Hello! I am ${name.trim()}. I just joined M1 Company and need guidance with my university coursework.`
        : `Hello Admin! I am ${name.trim()}. I just registered as an Expert Specialist and would like to be verified.`
    );

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          role,
          country: selectedCountry.code,
          currency: selectedCountry.currency,
          initialMessage: firstMsg,
          institution: `${selectedCountry.name} Academic Institution`,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        setSuccessMsg(`Welcome, ${data.user.name}! Your message is sent and chat is live.`);
        switchUser(data.user.id);
        await refreshUserData();
        setTimeout(() => {
          onClose();
          router.push('/chat');
        }, 500);
      } else {
        setErrorMsg(data.error || 'Failed to create direct account.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSwitch = async (userId: string) => {
    switchUser(userId);
    await refreshUserData();
    onClose();
    router.push('/chat');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-emerald-100 overflow-hidden">
        
        {/* Header with Emerald Mint Gradient */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center gap-1.5 bg-emerald-500/30 text-emerald-100 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-400/30">
              <Zap className="h-3 w-3 fill-emerald-300 text-emerald-300" />
              Direct 1-Click Access
            </span>
          </div>

          <h2 className="text-xl font-bold">M1 Company Registration</h2>
          <p className="text-xs text-emerald-100/90 mt-1">
            Enter your name & role to start chatting immediately. Admin receives your message in real-time.
          </p>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-4 bg-emerald-800/40 p-1 rounded-xl">
            <button
              onClick={() => {
                setTab('REGISTER');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'REGISTER'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              Direct Register
            </button>
            <button
              onClick={() => {
                setTab('SWITCH');
                setErrorMsg(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'SWITCH'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-emerald-100 hover:text-white'
              }`}
            >
              Quick Switch Role
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {tab === 'REGISTER' ? (
            <form onSubmit={handleDirectRegister} className="space-y-4 text-xs">
              
              {/* 1. Select Role: Student or Expert */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Register as: <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('STUDENT')}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      role === 'STUDENT'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs ring-2 ring-emerald-400/20'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <GraduationCap className="h-4 w-4 text-emerald-600" />
                    <span>Student / Lead</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('EXPERT')}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      role === 'EXPERT'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs ring-2 ring-emerald-400/20'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase className="h-4 w-4 text-teal-600" />
                    <span>Expert Mentor</span>
                  </button>
                </div>
              </div>

              {/* 2. Full Name Input (e.g. "David Miller") */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. David Miller"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-200 font-medium"
                  />
                </div>
              </div>

              {/* 3. First Question / Message for Admin & Specialists */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  First Message / Doubt (Sent automatically to Admin)
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={
                      role === 'STUDENT'
                        ? 'e.g. Need urgent help with my Machine Learning homework!'
                        : 'e.g. Applying as Senior PhD Specialist in Mathematics'
                    }
                    value={initialMessage}
                    onChange={(e) => setInitialMessage(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              </div>

              {/* 4. Country Selection */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Country / Region
                </label>
                <div className="relative">
                  <Globe className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-800 focus:border-emerald-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-200"
                  >
                    {SUPPORTED_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.name} ({c.currency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Direct Submit Button: "Instant Enter & Start Chat" */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-bold py-3.5 text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <span>Opening Live Chat Session...</span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-emerald-200" />
                    <span>Instant Enter & Start Chat</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                <span>Zero contact leakage • Masked Institutional IDs</span>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-medium">
                Tap any persona below to immediately simulate their live chat inbox:
              </p>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {allUsers.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleQuickSwitch(u.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-50/80 shadow-xs'
                          : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                          {u.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{u.name}</div>
                          <div className="text-[10px] text-slate-500">{u.maskedId} • {u.country || 'Global'}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-700'
                            : u.role === 'EXPERT'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {u.role}
                        </span>
                        {isCurrent && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
