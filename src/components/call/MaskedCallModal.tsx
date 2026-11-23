'use client';

import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, ShieldCheck, Radio, Sparkles } from 'lucide-react';

interface MaskedCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callerMaskedName: string;
  recipientMaskedName: string;
  recipientMaskedId: string;
  recipientAvatar?: string;
}

export default function MaskedCallModal({
  isOpen,
  onClose,
  callerMaskedName,
  recipientMaskedName,
  recipientMaskedId,
  recipientAvatar,
}: MaskedCallModalProps) {
  const [callState, setCallState] = useState<'RINGING' | 'CONNECTED' | 'ENDED'>('RINGING');
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionToken] = useState(() => `E2E-M4SK-${Math.floor(1000 + Math.random() * 9000)}`);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      setCallState('RINGING');
      setSeconds(0);
      setIsMuted(false);

      // Simulate connection after 2.5 seconds
      const connectTimeout = setTimeout(() => {
        setCallState('CONNECTED');
      }, 2500);

      return () => clearTimeout(connectTimeout);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === 'CONNECTED') {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  if (!isOpen) return null;

  const formatCallTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallState('ENDED');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-slate-850 to-slate-950 p-6 text-white shadow-2xl border border-slate-800">
        
        {/* Top Masking Banner */}
        <div className="mb-6 flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="h-4 w-4" />
            <span>Encrypted Masked Audio Tunnel</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full">
            {sessionToken}
          </span>
        </div>

        {/* Center Recipient Info */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className={`h-24 w-24 rounded-full overflow-hidden border-4 ${
              callState === 'RINGING' ? 'border-amber-400 animate-pulse' : 'border-emerald-500'
            } shadow-xl`}>
              <img
                src={recipientAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt={recipientMaskedName}
                className="h-full w-full object-cover"
              />
            </div>
            {callState === 'CONNECTED' && (
              <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-slate-900 text-[10px]">
                <Radio className="h-3 w-3 animate-spin" />
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold tracking-tight text-slate-100">
            {recipientMaskedName}
          </h3>
          <p className="mt-0.5 text-xs text-slate-400 font-mono">
            {recipientMaskedId}
          </p>

          {/* Status / Timer */}
          <div className="mt-3">
            {callState === 'RINGING' && (
              <div className="flex items-center gap-2 text-amber-300 text-sm font-medium animate-pulse">
                <span>Connecting masked call...</span>
              </div>
            )}
            {callState === 'CONNECTED' && (
              <div className="flex flex-col items-center">
                <span className="font-mono text-2xl font-semibold tracking-wider text-emerald-400">
                  {formatCallTime(seconds)}
                </span>
                <span className="text-[11px] text-slate-400 mt-1">Live Audio Session</span>
                
                {/* Audio Wave Visualizer Simulation */}
                <div className="mt-4 flex items-center justify-center gap-1.5 h-8">
                  {[40, 75, 55, 90, 65, 80, 45, 95, 60, 70, 50].map((height, i) => (
                    <span
                      key={i}
                      className="w-1 rounded-full bg-emerald-400 transition-all duration-300"
                      style={{
                        height: isMuted ? '6px' : `${Math.max(8, (height * (1 + Math.sin(seconds + i))) % 32)}px`,
                        opacity: isMuted ? 0.3 : 0.85,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            {callState === 'ENDED' && (
              <span className="text-rose-400 text-sm font-medium">Call Ended</span>
            )}
          </div>
        </div>

        {/* Strict Privacy Notice */}
        <div className="my-6 rounded-xl bg-slate-800/40 p-3 text-center border border-slate-700/50">
          <p className="text-[11px] text-slate-300 leading-relaxed">
            🔒 <strong className="text-white">Zero Contact Leakage:</strong> Neither party's actual phone number or personal details are exposed. All audio is securely relayed via M1 Company WebRTC.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-6 pt-2">
          {callState !== 'ENDED' && (
            <>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                  isMuted ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>

              <button
                onClick={handleEndCall}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-600/30 hover:bg-rose-700 transition-all active:scale-95"
                title="End Call"
              >
                <PhoneOff className="h-6 w-6" />
              </button>

              <button
                className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all"
                title="Speaker Output"
              >
                <Volume2 className="h-5 w-5" />
              </button>
            </>
          )}

          {callState === 'ENDED' && (
            <button
              onClick={onClose}
              className="rounded-xl bg-slate-800 px-6 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-all"
            >
              Close Window
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
