'use client';

import React from 'react';
import { OrderStatus } from '@/types';
import { CheckCircle2, Clock, Send, Award, FileCheck2, AlertCircle } from 'lucide-react';

interface OrderLifecycleTrackerProps {
  status: OrderStatus;
  className?: string;
}

const STAGES: { key: OrderStatus; label: string; icon: any }[] = [
  { key: 'SUBMITTED', label: 'Query Submitted', icon: Send },
  { key: 'EXPERT_ASSIGNED', label: 'Expert Assigned', icon: Clock },
  { key: 'IN_PROGRESS', label: 'In Progress (Escrow Locked)', icon: FileCheck2 },
  { key: 'DELIVERED', label: 'Solution Delivered', icon: Award },
  { key: 'COMPLETED', label: 'Order Completed & Rated', icon: CheckCircle2 },
];

export default function OrderLifecycleTracker({ status, className }: OrderLifecycleTrackerProps) {
  const getStageIndex = (st: OrderStatus): number => {
    switch (st) {
      case 'SUBMITTED':
        return 0;
      case 'EXPERT_ASSIGNED':
        return 1;
      case 'IN_PROGRESS':
        return 2;
      case 'DELIVERED':
        return 3;
      case 'COMPLETED':
        return 4;
      default:
        return 1;
    }
  };

  const currentIndex = getStageIndex(status);

  return (
    <div className={`w-full py-2 ${className || ''}`}>
      <div className="relative flex items-center justify-between">
        {/* Continuous progress line behind dots */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-slate-200 -z-0">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${(currentIndex / (STAGES.length - 1)) * 100}%` }}
          />
        </div>

        {STAGES.map((stage, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = stage.icon;

          return (
            <div key={stage.key} className="relative z-10 flex flex-col items-center">
              <div
                className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border-2 transition-all shadow-xs ${
                  isCurrent
                    ? 'border-emerald-600 bg-emerald-600 text-white ring-4 ring-emerald-100 scale-110'
                    : isDone
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-slate-300 bg-white text-slate-400'
                }`}
              >
                {isDone && !isCurrent ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <span
                className={`mt-2 text-[10px] sm:text-xs font-semibold text-center whitespace-nowrap max-w-[90px] leading-tight ${
                  isCurrent
                    ? 'text-emerald-700 font-bold'
                    : isDone
                    ? 'text-slate-800'
                    : 'text-slate-400'
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
