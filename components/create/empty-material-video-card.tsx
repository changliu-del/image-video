'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';

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
  const hasMeasuredInitialViewport = useRef(false);
  const shouldLoadWhenEnteringViewport = useRef(false);
  const [activationMode, setActivationMode] =
    useState<PreviewActivationMode>('idle');
  const [isFinePointer, setIsFinePointer] = useState(false);
  const [canAutoplayVideo, setCanAutoplayVideo] = useState(false);
  const isPreviewArmed = activationMode !== 'idle';

  const armAutoplayPreview = useCallback(() => {
    setActivationMode((current) => (current === 'idle' ? 'auto' : current));
  }, []);

  const armManualPreview = useCallback(() => {
    setActivationMode('manual');
  }, []);

  const armFromFinePointer = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
        armAutoplayPreview();
      }
    },
    [armAutoplayPreview]
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') {
      setCanAutoplayVideo(true);
      return;
    }

    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );
    const finePointerQuery = window.matchMedia(
      '(hover: hover) and (pointer: fine)'
    );
    const syncMediaPreferences = () => {
      setCanAutoplayVideo(!reducedMotionQuery.matches);
      setIsFinePointer(finePointerQuery.matches);
    };

    syncMediaPreferences();
    if (typeof reducedMotionQuery.addEventListener === 'function') {
      reducedMotionQuery.addEventListener('change', syncMediaPreferences);
      finePointerQuery.addEventListener('change', syncMediaPreferences);
      return () => {
        reducedMotionQuery.removeEventListener('change', syncMediaPreferences);
        finePointerQuery.removeEventListener('change', syncMediaPreferences);
      };
    }

    reducedMotionQuery.addListener(syncMediaPreferences);
    finePointerQuery.addListener(syncMediaPreferences);
    return () => {
      reducedMotionQuery.removeListener(syncMediaPreferences);
      finePointerQuery.removeListener(syncMediaPreferences);
    };
  }, []);

  useEffect(() => {
    if (isPreviewArmed || !canAutoplayVideo || !isFinePointer) return;

    const cardElement = cardRef.current;
    if (!cardElement || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;

        if (!hasMeasuredInitialViewport.current) {
          hasMeasuredInitialViewport.current = true;
          shouldLoadWhenEnteringViewport.current = !entry.isIntersecting;
          return;
        }

        if (entry.isIntersecting && shouldLoadWhenEnteringViewport.current) {
          setActivationMode((current) =>
            current === 'idle' ? 'auto' : current
          );
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
  }, [canAutoplayVideo, isFinePointer, isPreviewArmed]);

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
        onPointerEnter={armFromFinePointer}
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
              preload="none"
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
