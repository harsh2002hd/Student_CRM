'use client';

import React, { useState, useEffect } from 'react';
import { AdBanner } from '@/types';
import {
  Megaphone,
  PlusCircle,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Eye,
  MousePointerClick,
  Sparkles,
  ExternalLink,
  X,
} from 'lucide-react';

export default function AdminAdsPage() {
  const [banners, setBanners] = useState<AdBanner[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Form fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('Limited Offer');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80');
  const [ctaText, setCtaText] = useState('Claim Offer');
  const [ctaLink, setCtaLink] = useState('#post-query');
  const [category, setCategory] = useState('Academic');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBanners = async () => {
    try {
      const res = await fetch('/api/ads?all=true');
      const data = await res.json();
      if (data.success) {
        setBanners(data.banners);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const handleToggle = async (id: string) => {
    try {
      const res = await fetch(`/api/ads/${id}/toggle`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        loadBanners();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotional banner?')) return;
    try {
      const res = await fetch(`/api/ads/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        loadBanners();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle,
          badge,
          imageUrl,
          ctaText,
          ctaLink,
          category,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsCreating(false);
        setTitle('');
        setSubtitle('');
        loadBanners();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
              Marketing & Promotions
            </span>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Promotional Ad Banner Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Control banners rendered on the student portal. Active cards are served in the rotating carousel.
            </p>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-800 shadow-sm"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Create Promotional Banner</span>
          </button>
        </div>

        {/* Banners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((b) => (
            <div
              key={b.id}
              className={`rounded-3xl bg-white border p-6 flex flex-col justify-between shadow-xs transition-all ${
                b.isActive ? 'border-brand-200 ring-1 ring-brand-100' : 'border-slate-200 opacity-60'
              }`}
            >
              <div>
                {/* Image preview */}
                <div className="relative h-40 w-full rounded-2xl overflow-hidden mb-4 shadow-inner">
                  <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover" />
                  <span className="absolute top-2.5 left-2.5 rounded-full bg-slate-900/80 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold text-white">
                    {b.badge}
                  </span>
                  <span className={`absolute top-2.5 right-2.5 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
                    b.isActive ? 'bg-emerald-600' : 'bg-slate-600'
                  }`}>
                    {b.isActive ? 'LIVE' : 'INACTIVE'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 leading-snug">
                  {b.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {b.subtitle}
                </p>

                {/* Metrics */}
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3">
                  <span className="flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                    <strong>{b.viewsCount}</strong> views
                  </span>
                  <span className="flex items-center gap-1">
                    <MousePointerClick className="h-3.5 w-3.5 text-brand-600" />
                    <strong>{b.clicksCount}</strong> clicks
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {b.category}
                  </span>
                </div>
              </div>

              {/* Action toggles */}
              <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between">
                <button
                  onClick={() => handleToggle(b.id)}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                    b.isActive
                      ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {b.isActive ? <ToggleRight className="h-5 w-5 text-emerald-600" /> : <ToggleLeft className="h-5 w-5 text-slate-400" />}
                  <span>{b.isActive ? 'Active (Live)' : 'Disabled'}</span>
                </button>

                <button
                  onClick={() => handleDelete(b.id)}
                  className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-colors"
                  title="Delete banner"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Create Banner Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100">
            <button
              onClick={() => setIsCreating(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900">
              Create Promotional Banner
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Card will be featured in the Student Dashboard Carousel.
            </p>

            <form onSubmit={handleCreate} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 🚀 Final Exam Cram: 1-on-1 Mentorship with IIT Alumni"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-brand-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Subtitle / Marketing Copy *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Get 24-hr turnaround doubt clearing on assignments..."
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-brand-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 font-mono text-[11px] focus:outline-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-brand-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">CTA Link</label>
                  <input
                    type="text"
                    value={ctaLink}
                    onChange={(e) => setCtaLink(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-slate-900 focus:outline-brand-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-brand-600 px-5 py-2 font-bold text-white hover:bg-brand-700 shadow-md shadow-brand-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Publish Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
