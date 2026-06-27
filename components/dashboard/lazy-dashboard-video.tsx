'use client';

import { useEffect, useState } from 'react';

type LazyDashboardVideoProps = {
  src: string;
  poster: string;
  active: boolean;
  className?: string;
  posterAlt?: string;
};

export function LazyDashboardVideo({
  active,
  className,
  poster,
  posterAlt = '',
  src,
}: LazyDashboardVideoProps) {
  const [hasCheckedMotionPreference, setHasCheckedMotionPreference] =
    useState(false);
  const [shouldKeepPosterOnly, setShouldKeepPosterOnly] = useState(false);

  useEffect(() => {
    if (!active) return;

    if (typeof window.matchMedia !== 'function') {
      setHasCheckedMotionPreference(true);
      return;
    }

    const reducedMotionQuery = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    );
    const syncMotionPreference = () => {
      setShouldKeepPosterOnly(reducedMotionQuery.matches);
      setHasCheckedMotionPreference(true);
    };

    syncMotionPreference();
    if (typeof reducedMotionQuery.addEventListener === 'function') {
      reducedMotionQuery.addEventListener('change', syncMotionPreference);
      return () => {
        reducedMotionQuery.removeEventListener('change', syncMotionPreference);
      };
    }

    reducedMotionQuery.addListener(syncMotionPreference);
    return () => {
      reducedMotionQuery.removeListener(syncMotionPreference);
    };
  }, [active]);

  if (!active || !hasCheckedMotionPreference || shouldKeepPosterOnly) {
    return (
      <img
        src={poster}
        alt={posterAlt}
        className={className}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <video
      src={src}
      poster={poster}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload="none"
    />
  );
}
