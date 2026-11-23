'use client';

import React, { useState } from 'react';
import { Star, X, CheckCircle2 } from 'lucide-react';
import { Order } from '@/types';

interface RatingModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onRated: () => void;
}

export default function RatingModal({ order, isOpen, onClose, onRated }: RatingModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: order.studentId,
          rating,
          comment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setTimeout(() => {
          onRated();
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Rating error', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl p-6 border border-slate-100 animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 rounded-full p-1"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="flex flex-col items-center text-center py-6">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Thank you for your rating!</h4>
            <p className="text-xs text-slate-500 mt-1">
              Your feedback helps maintain academic quality on M1 Company.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="text-center mb-4">
              <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
                Order Completed
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                Rate Your Experience with {order.expertName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {order.queryTitle}
              </p>
            </div>

            {/* Stars */}
            <div className="flex items-center justify-center gap-2 my-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-120 focus:outline-hidden"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      (hoverRating || rating) >= star
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="text-center text-xs font-semibold text-slate-700 mb-4">
              {rating === 5 && '🌟 Outstanding mentor, exceeded expectations!'}
              {rating === 4 && '👍 Great help, very clear solution.'}
              {rating === 3 && '👌 Satisfactory delivery.'}
              {rating === 2 && '👎 Needs improvement in explanations.'}
              {rating === 1 && '⚠️ Very poor quality.'}
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Leave a review note (optional):
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How helpful was the expert's explanations, diagrams, or derivations?"
                className="w-full text-xs text-slate-800 border border-slate-200 rounded-xl p-3 focus:outline-brand-500 min-h-[90px]"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-brand-700 shadow-md shadow-brand-500/20 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
