'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

type LazyVideoProps = {
  src: string;
  poster: string;
  className?: string;
  containerClassName?: string;
  rootMargin?: string;
  preload?: 'auto' | 'metadata' | 'none';
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
  posterAlt?: string;
  respectReducedMotion?: boolean;
};

export function LazyVideo({
  autoPlay = true,
  className,
  containerClassName = 'size-full',
  loop = true,
  muted = true,
  playsInline = true,
  poster,
  posterAlt = '',
  preload = 'metadata',
  respectReducedMotion = true,
  rootMargin = '0px',
  src,
}: LazyVideoProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const [shouldKeepPosterOnly, setShouldKeepPosterOnly] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reducedMotionQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    if (respectReducedMotion && autoPlay && reducedMotionQuery?.matches) {
      setShouldKeepPosterOnly(true);
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setShouldLoadVideo(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldLoadVideo(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, [autoPlay, respectReducedMotion, rootMargin]);

  return (
    <div ref={rootRef} className={cn('overflow-hidden', containerClassName)}>
      {shouldLoadVideo && !shouldKeepPosterOnly ? (
        <video
          src={src}
          poster={poster}
          className={className}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline={playsInline}
          preload={preload}
        />
      ) : (
        <img
          src={poster}
          alt={posterAlt}
          className={className}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}
