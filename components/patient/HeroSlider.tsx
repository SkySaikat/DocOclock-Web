import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroBanner {
  id: string;
  desktop_image_url: string;
  mobile_image_url?: string;
  title?: string;
}

interface HeroSliderProps {
  banners: HeroBanner[];
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ banners }) => {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (banners.length <= 1 || paused) return;
    const t = setInterval(() => setCurrent(c => (c + 1) % banners.length), 4000);
    return () => clearInterval(t);
  }, [banners.length, paused]);

  // Reset index when banners change
  useEffect(() => {
    setCurrent(0);
  }, [banners.length]);

  if (!banners.length) {
    return <div className="absolute inset-0 bg-slate-900" />;
  }

  const prev = () => setCurrent(c => (c - 1 + banners.length) % banners.length);
  const next = () => setCurrent(c => (c + 1) % banners.length);

  return (
    <div
      className="absolute inset-0"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {banners.map((b, i) => (
        <picture
          key={b.id}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0'}`}
        >
          <source media="(max-width: 768px)" srcSet={b.mobile_image_url || b.desktop_image_url} />
          <img
            src={b.desktop_image_url}
            alt={b.title || `Slide ${i + 1}`}
            className="w-full h-full object-cover"
          />
        </picture>
      ))}

      {/* Prev / Next arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight size={18} />
          </button>
        </>
      )}

      {/* Dot indicators */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? 'bg-white w-5' : 'bg-white/50 w-1.5'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
