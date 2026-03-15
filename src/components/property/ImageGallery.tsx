'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ImageGalleryProps {
  images: string[];
  alt: string;
}

export default function ImageGallery({ images, alt }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const t = useTranslations('property');

  const prev = useCallback(() => setCurrent(i => (i === 0 ? images.length - 1 : i - 1)), [images.length]);
  const next = useCallback(() => setCurrent(i => (i === images.length - 1 ? 0 : i + 1)), [images.length]);

  return (
    <>
      <div className="relative max-w-[900px] mx-auto">
        <div
          className="relative aspect-[16/9] rounded-xl overflow-hidden cursor-pointer bg-gray-100"
          onClick={() => setLightbox(true)}
          role="button"
          aria-roledescription="carousel"
          aria-label={t('gallery')}
        >
          <Image
            src={images[current]}
            alt={`${alt} - ${current + 1}`}
            fill
            sizes="(max-width: 900px) 100vw, 900px"
            className="object-cover"
            priority={current === 0}
          />
          <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {current + 1} / {images.length}
          </div>
        </div>

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-colors"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {images.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-[#00B4C8]' : 'bg-gray-300'}`}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 w-12 h-12 text-white hover:bg-white/10 rounded-full flex items-center justify-center z-10"
            aria-label="Close lightbox"
          >
            <X size={28} />
          </button>
          <div className="relative w-full h-full max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <Image
              src={images[current]}
              alt={`${alt} - ${current + 1}`}
              fill
              sizes="90vw"
              className="object-contain"
            />
          </div>
          {images.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 text-white hover:bg-white/10 rounded-full flex items-center justify-center"
                aria-label="Previous"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={e => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 text-white hover:bg-white/10 rounded-full flex items-center justify-center"
                aria-label="Next"
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
