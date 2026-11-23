'use client';

import React, { useState, useEffect } from 'react';
import { AdBanner } from '@/types';
import { ArrowRight, Sparkles, Tag, ChevronLeft, ChevronRight } from 'lucide-react';

interface AdBannerCarouselProps {
  onCtaClick?: (ctaLink: string) => void;
}

export default function AdBannerCarousel({ onCtaClick }: AdBannerCarouselProps) {
  const [banners, setBanners] = useState<AdBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch('/api/ads')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.banners.length > 0) {
          setBanners(data.banners);
        }
      })
      .catch((err) => console.error('Error fetching ads', err));
  }, []);

  if (banners.length === 0) return null;

  const current = banners[currentIndex];

  const nextBanner = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 text-white shadow-lg shadow-brand-900/10 border border-brand-800/40">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 sm:p-8 items-center">
        
        {/* Left Text & CTA */}
        <div className="md:col-span-7 flex flex-col items-start z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/30 text-brand-200 border border-brand-400/30 backdrop-blur-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              {current.badge}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Category: {current.category}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2 leading-snug">
            {current.title}
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed mb-6 max-w-xl">
            {current.subtitle}
          </p>

          <div className="flex items-center gap-3">
            <a
              href={current.ctaLink}
              onClick={(e) => {
                if (onCtaClick) {
                  e.preventDefault();
                  onCtaClick(current.ctaLink);
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-500 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-brand-500/25 hover:from-brand-600 hover:to-indigo-600 transition-all active:scale-95"
            >
              <span>{current.ctaText}</span>
              <ArrowRight className="h-4 w-4" />
            </a>

            <span className="text-[11px] text-slate-400">
              Verified Platform Sponsor
            </span>
          </div>
        </div>

        {/* Right Graphic Preview */}
        <div className="md:col-span-5 relative h-48 sm:h-56 w-full rounded-xl overflow-hidden shadow-inner group">
          <img
            src={current.imageUrl}
            alt={current.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-200">
            <span className="bg-slate-900/80 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-mono">
              📢 Active Ad #{currentIndex + 1}
            </span>
            <span className="text-[11px] text-slate-300">
              {current.clicksCount} clicks today
            </span>
          </div>
        </div>
      </div>

      {/* Slide Navigation Dots & Arrows */}
      {banners.length > 1 && (
        <div className="flex items-center justify-between px-6 pb-4 pt-1 border-t border-slate-800/60 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === currentIndex ? 'w-6 bg-brand-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevBanner}
              className="p-1 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              title="Previous banner"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextBanner}
              className="p-1 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              title="Next banner"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
