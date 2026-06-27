'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type EmptyMaterialVideoCardProps = {
  src: string;
  poster: string;
  label: string;
};

type PreviewActivationMode = 'idle' | 'auto' | 'manual';

export function EmptyMaterialVideoCard({
  label,
  poster,
  src,
}: EmptyMaterialVideoCardProps) {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [activationMode, setActivationMode] =
    useState<PreviewActivationMode>('idle');
  const [canAutoplayVideo, setCanAutoplayVideo] = useState(false);
  const isPreviewArmed = activationMode !== 'idle';

  const armAutoplayPreview = useCallback(() => {
    setActivationMode((current) => (current === 'idle' ? 'auto' : current));
  }, []);

  const armManualPreview = useCallback(() => {
    setActivationMode('manual');
  }, []);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      setCanAutoplayVideo(true);
      return;
    }

    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );
    const syncMediaPreferences = () => {
      setCanAutoplayVideo(!reducedMotionQuery.matches);
    };

    syncMediaPreferences();
    if (typeof reducedMotionQuery.addEventListener === 'function') {
      reducedMotionQuery.addEventListener('change', syncMediaPreferences);
      return () => {
        reducedMotionQuery.removeEventListener('change', syncMediaPreferences);
      };
    }

    reducedMotionQuery.addListener(syncMediaPreferences);
    return () => {
      reducedMotionQuery.removeListener(syncMediaPreferences);
    };
  }, []);

  useEffect(() => {
    if (isPreviewArmed || !canAutoplayVideo) return;

    const cardElement = cardRef.current;
    if (!cardElement) return;

    if (!('IntersectionObserver' in window)) {
      armAutoplayPreview();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        if (entry.isIntersecting) {
          armAutoplayPreview();
          observer.disconnect();
        }
      },
      {
        rootMargin: '0px',
        threshold: 0.25,
      }
    );

    observer.observe(cardElement);
    return () => observer.disconnect();
  }, [armAutoplayPreview, canAutoplayVideo, isPreviewArmed]);

  const shouldRenderVideo =
    isPreviewArmed && (canAutoplayVideo || activationMode === 'manual');
  const shouldAutoplayVideo = canAutoplayVideo;

  return (
    <figure className="text-center">
      <button
        ref={cardRef}
        type="button"
        aria-label={label}
        className="block w-full rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
        onClick={armManualPreview}
        onFocus={armAutoplayPreview}
        onPointerEnter={armAutoplayPreview}
      >
        <div className="aspect-[3/4] overflow-hidden rounded-lg bg-white shadow-sm">
          {shouldRenderVideo ? (
            <video
              src={src}
              poster={poster}
              className="size-full object-cover"
              autoPlay={shouldAutoplayVideo}
              controls={!shouldAutoplayVideo}
              muted
              loop={shouldAutoplayVideo}
              playsInline
              preload="metadata"
            />
          ) : (
            <img
              src={poster}
              alt=""
              className="size-full object-cover"
              loading="lazy"
              decoding="async"
            />
          )}
        </div>
      </button>
      <figcaption className="mt-4 text-sm font-bold text-gray-500">
        {label}
      </figcaption>
    </figure>
  );
}
