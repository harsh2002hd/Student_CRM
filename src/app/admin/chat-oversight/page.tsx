'use client';

import React, { useState, useEffect } from 'react';
import { FlaggedMessageRecord, User } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Eye,
  FileText,
  Lock,
  Trash2,
  Filter,
  Sparkles,
  RefreshCw,
  MessageSquare,
  Check,
  X,
  Play,
  UserCheck,
  ShieldCheck,
  Volume2,
} from 'lucide-react';

export default function AdminChatOversightPage() {
  const { socket } = useSocket();
  const { allUsers } = useAuth();

  const [flaggedMessages, setFlaggedMessages] = useState<FlaggedMessageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PENDING' | 'WARNED' | 'DISMISSED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Warning Modal State
  const [warningModalTarget, setWarningModalTarget] = useState<FlaggedMessageRecord | null>(null);
  const [customWarningText, setCustomWarningText] = useState('');
  const [isSubmittingWarning, setIsSubmittingWarning] = useState(false);

  // Live Anti-Bypass Testing Simulator State
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatedStudentId, setSimulatedStudentId] = useState('');
  const [simulatedContent, setSimulatedContent] = useState(
    'Hey, call me directly at +91 98765 43210 or ping my WhatsApp wa.me/919876543210 to avoid platform fees!'
  );
  const [isSimulating, setIsSimulating] = useState(false);

  const studentUsers = React.useMemo(() => {
    return (allUsers || []).filter((u) => u && u.role === 'STUDENT');
  }, [allUsers]);

  const loadFlagged = async () => {
    try {
      const res = await fetch('/api/chat/flagged');
      const data = await res.json();
      if (data.success) {
        setFlaggedMessages(data.flaggedMessages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlagged();
  }, []);

  // Set default simulated student once users load
  useEffect(() => {
    if (studentUsers.length > 0 && !simulatedStudentId) {
      setSimulatedStudentId(studentUsers[0].id);
    }
  }, [studentUsers, simulatedStudentId]);

  // Real-time Socket.io Listeners
  useEffect(() => {
    if (!socket) return;

    const handleIncidentLogged = (payload: { incident?: FlaggedMessageRecord }) => {
      if (payload?.incident) {
        setFlaggedMessages((prev) => {
          const exists = prev.some((p) => p.id === payload.incident!.id);
          if (exists) return prev;
          return [payload.incident!, ...prev];
        });
        setActionNotice(`🚨 Real-Time Alert: New contact circumvention intercepted from ${payload.incident.senderName}!`);
      } else {
        loadFlagged();
      }
    };

    const handleIncidentUpdated = (payload: { id: string; status: any; item: FlaggedMessageRecord }) => {
      setFlaggedMessages((prev) =>
        prev.map((item) => (item.id === payload.id ? { ...item, status: payload.status } : item))
      );
    };

    const handleIncidentDeleted = (payload: { id: string }) => {
      setFlaggedMessages((prev) => prev.filter((item) => item.id !== payload.id));
    };

    const handleIncidentCleared = () => {
      setFlaggedMessages([]);
    };

    socket.on('flagged_incident_logged', handleIncidentLogged);
    socket.on('flagged_incident_updated', handleIncidentUpdated);
    socket.on('flagged_incident_deleted', handleIncidentDeleted);
    socket.on('flagged_incident_cleared', handleIncidentCleared);

    return () => {
      socket.off('flagged_incident_logged', handleIncidentLogged);
      socket.off('flagged_incident_updated', handleIncidentUpdated);
      socket.off('flagged_incident_deleted', handleIncidentDeleted);
      socket.off('flagged_incident_cleared', handleIncidentCleared);
    };
  }, [socket]);

  // Dismiss Incident
  const handleDismiss = async (id: string, senderName: string) => {
    try {
      const res = await fetch('/api/chat/flagged', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'DISMISSED' }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(`Incident ${id} for ${senderName} marked as Dismissed (False Positive).`);
        setFlaggedMessages((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: 'DISMISSED' } : item))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Safety Warning Dialog
  const openWarningDialog = (record: FlaggedMessageRecord) => {
    setWarningModalTarget(record);
    setCustomWarningText(
      `⚠️ [OFFICIAL SAFETY WARNING] Our Zero Contact Leakage monitor intercepted an off-platform contact exchange attempt. Sharing mobile numbers, emails, or personal messaging handles (WhatsApp/Telegram/Instagram) violates M1 Company Platform Policy. All orders, communication, and payments must remain within M1 Company to preserve platform escrow guarantees and account safety.`
    );
  };

  // Confirm Dispatch of Safety Warning
  const handleConfirmWarning = async () => {
    if (!warningModalTarget) return;
    setIsSubmittingWarning(true);
    try {
      const res = await fetch('/api/chat/flagged', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: warningModalTarget.id,
          status: 'WARNING_ISSUED',
          customWarning: customWarningText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(
          `⚠️ Formal safety warning dispatched to ${warningModalTarget.senderName} and inserted into their chat thread.`
        );
        setFlaggedMessages((prev) =>
          prev.map((item) => (item.id === warningModalTarget.id ? { ...item, status: 'WARNING_ISSUED' } : item))
        );
        setWarningModalTarget(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingWarning(false);
    }
  };

  // Delete Individual Incident
  const handleDeleteIncident = async (id: string) => {
    try {
      const res = await fetch(`/api/chat/flagged?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setFlaggedMessages((prev) => prev.filter((item) => item.id !== id));
        setActionNotice(`Incident ${id} has been permanently deleted from records.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Clear All Incidents
  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all flagged incidents from audit history?')) return;
    try {
      const res = await fetch('/api/chat/flagged?clearAll=true', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setFlaggedMessages([]);
        setActionNotice('All flagged audit incidents have been cleared.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Simulate Real-Time Anti-Bypass Interception
  const handleSimulateViolation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulatedContent.trim()) return;

    setIsSimulating(true);
    const student = studentUsers.find((u) => u.id === simulatedStudentId) || studentUsers[0] || {
      id: 'usr_stu_1',
      name: 'David Miller',
      maskedId: 'STU-9382',
      role: 'STUDENT',
    };

    try {
      const res = await fetch('/api/chat/flagged', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: student.id,
          senderRole: 'STUDENT',
          senderName: `${student.name} (${student.maskedId || 'STU-XXXX'})`,
          content: simulatedContent.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(`✅ Interception Simulated! Scanner detected violation and created incident ${data.incident.id}.`);
        loadFlagged();
      } else {
        alert(data.error || 'Failed to simulate');
      }
    } catch (err: any) {
      alert(err.message || 'Error executing test');
    } finally {
      setIsSimulating(false);
    }
  };

  // Filtered List
  const filteredMessages = flaggedMessages.filter((item) => {
    if (selectedFilter === 'PENDING' && item.status !== 'PENDING_REVIEW') return false;
    if (selectedFilter === 'WARNED' && item.status !== 'WARNING_ISSUED') return false;
    if (selectedFilter === 'DISMISSED' && item.status !== 'DISMISSED') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.senderName?.toLowerCase().includes(q);
      const matchText = item.flaggedText?.toLowerCase().includes(q);
      const matchTypes = item.attemptedLeakType?.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchText && !matchTypes) return false;
    }
    return true;
  });

  const pendingCount = flaggedMessages.filter((f) => f.status === 'PENDING_REVIEW').length;
  const warnedCount = flaggedMessages.filter((f) => f.status === 'WARNING_ISSUED').length;
  const dismissedCount = flaggedMessages.filter((f) => f.status === 'DISMISSED').length;

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50/70 flex items-center justify-center">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <RefreshCw className="h-4 w-4 animate-spin text-rose-500" />
          <span>Loading Anti-Bypass Oversight...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-md uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                Real-Time Security Enforcement
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Zero Contact Leakage Protocol
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1.5">
              Chat Anti-Bypass & Circumvention Oversight
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Autonomous regex scanner intercepts phone numbers, emails, and external app links before they reach the counterparty.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSimulator(!showSimulator)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition-colors shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
              <span>{showSimulator ? 'Close Live Scanner Test' : 'Test Live Scanner'}</span>
            </button>
            {flaggedMessages.length > 0 && (
              <button
                onClick={handleClearAll}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:border-rose-200 transition-colors"
                title="Clear all audit incidents"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Notice Alert */}
        {actionNotice && (
          <div className="rounded-2xl bg-slate-900 text-white p-4 text-xs font-medium flex items-center justify-between shadow-lg shadow-slate-900/10 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold">
                ✓
              </span>
              <span>{actionNotice}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="text-slate-400 hover:text-white font-bold p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Live Anti-Bypass Testing Sandbox Simulator (Collapsible) */}
        {showSimulator && (
          <div className="rounded-3xl bg-white border border-indigo-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-50 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs">
                  ⚡
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Live Anti-Bypass Testing & Simulation Sandbox
                  </h3>
                  <p className="text-xs text-slate-500">
                    Simulate how a real student message is intercepted, sanitized, logged, and alerted in real time.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSimulator(false)}
                className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSimulateViolation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Simulate As Student
                  </label>
                  <select
                    value={simulatedStudentId}
                    onChange={(e) => setSimulatedStudentId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {studentUsers.map((stu) => (
                      <option key={stu.id} value={stu.id}>
                        {stu.name} ({stu.maskedId})
                      </option>
                    ))}
                    {studentUsers.length === 0 && (
                      <option value="usr_stu_1">David Miller (STU-9382)</option>
                    )}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Message String with Contact / Off-Platform Link to Intercept
                  </label>
                  <input
                    type="text"
                    value={simulatedContent}
                    onChange={(e) => setSimulatedContent(e.target.value)}
                    placeholder="Enter message with phone, email, or WhatsApp/Telegram link..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="font-semibold text-indigo-600">Quick presets:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setSimulatedContent('Please call me on +91 98765 43210 or email me at user@college.edu')
                    }
                    className="underline hover:text-slate-800"
                  >
                    Phone + Email
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() =>
                      setSimulatedContent('Add me on Telegram t.me/student_direct or WhatsApp wa.me/14155552671')
                    }
                    className="underline hover:text-slate-800"
                  >
                    WhatsApp & Telegram
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSimulating}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-xs"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>{isSimulating ? 'Scanning...' : 'Test Scanner & Intercept'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Bar & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                selectedFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Incidents ({flaggedMessages.length})
            </button>
            <button
              onClick={() => setSelectedFilter('PENDING')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1.5 ${
                selectedFilter === 'PENDING'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <span>Pending Review</span>
              {pendingCount > 0 && (
                <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px] font-extrabold">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setSelectedFilter('WARNED')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                selectedFilter === 'WARNED'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Warning Issued ({warnedCount})
            </button>
            <button
              onClick={() => setSelectedFilter('DISMISSED')}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                selectedFilter === 'DISMISSED'
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Dismissed ({dismissedCount})
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by sender or keyword..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-1.5 pl-3 pr-8 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Flagged Incidents List */}
        <div className="space-y-4">
          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-300" />
              Loading security audit records...
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-800">No contact bypass violations</h3>
              <p className="text-xs text-slate-500 mt-1">
                All student and expert chat threads comply with platform privacy rules.
              </p>
              <button
                onClick={() => setShowSimulator(true)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-slate-800"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>Test Scanner With Simulated Leak</span>
              </button>
            </div>
          ) : (
            filteredMessages.map((item) => (
              <div
                key={item.id}
                className="rounded-3xl bg-white p-6 border border-rose-200/90 shadow-2xs space-y-4 hover:border-rose-300 transition-all"
              >
                {/* Meta Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-100 text-rose-600 font-bold text-xs">
                      !
                    </span>
                    <span className="font-bold text-xs text-slate-900">
                      Sender: {item.senderName} ({item.senderRole})
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="font-mono text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Time: {formatDateTime(item.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.attemptedLeakType?.map((type, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 text-[10px] font-bold"
                      >
                        {type} ATTEMPT
                      </span>
                    ))}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        item.status === 'WARNING_ISSUED'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : item.status === 'DISMISSED'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* String comparison: Original vs Redacted */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Original unredacted (Confidential Admin Audit) */}
                  <div className="rounded-2xl bg-rose-50/60 border border-rose-200 p-4">
                    <div className="flex items-center gap-1.5 font-bold text-rose-900 mb-2">
                      <Lock className="h-3.5 w-3.5 text-rose-600" />
                      <span>Original Intercepted String (Hidden from Counterparty):</span>
                    </div>
                    <p className="font-mono text-xs text-rose-950 bg-white/90 p-3 rounded-xl border border-rose-200 leading-relaxed break-all">
                      "{item.flaggedText}"
                    </p>
                  </div>

                  {/* Sanitized Version (Sent to Chat) */}
                  <div className="rounded-2xl bg-emerald-50/60 border border-emerald-200 p-4">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900 mb-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Sanitized & Delivered to Counterparty:</span>
                    </div>
                    <p className="font-mono text-xs text-emerald-950 bg-white/90 p-3 rounded-xl border border-emerald-200 leading-relaxed break-all">
                      "{item.redactedText}"
                    </p>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Incident ID: {item.id}
                    </span>
                    <button
                      onClick={() => handleDeleteIncident(item.id)}
                      className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === 'PENDING_REVIEW' && (
                      <>
                        <button
                          onClick={() => handleDismiss(item.id, item.senderName)}
                          className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                          Dismiss False Positive
                        </button>
                        <button
                          onClick={() => openWarningDialog(item)}
                          className="rounded-xl bg-rose-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition-colors shadow-xs flex items-center gap-1"
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                          <span>Issue Safety Warning</span>
                        </button>
                      </>
                    )}

                    {item.status === 'WARNING_ISSUED' && (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200 flex items-center gap-1">
                        <Check className="h-3 w-3 text-amber-600" />
                        Warning Dispatched to User Chat
                      </span>
                    )}

                    {item.status === 'DISMISSED' && (
                      <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
                        Marked as False Positive
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Safety Warning Dispatch Modal */}
      {warningModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>Issue Safety Warning to {warningModalTarget.senderName}</span>
              </div>
              <button
                onClick={() => setWarningModalTarget(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Dispatching this warning will automatically post an official security enforcement warning message into this user's active chat thread and update incident <span className="font-mono font-bold text-slate-800">{warningModalTarget.id}</span> to <span className="font-bold text-amber-600">WARNING_ISSUED</span>.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Warning Message Text (Sent to Student/Expert)
              </label>
              <textarea
                rows={4}
                value={customWarningText}
                onChange={(e) => setCustomWarningText(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500 font-sans leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setWarningModalTarget(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingWarning}
                onClick={handleConfirmWarning}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSubmittingWarning ? 'Dispatching...' : 'Dispatch Safety Warning Now'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
