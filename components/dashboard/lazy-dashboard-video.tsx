'use client';

import { useEffect, useRef, useState } from 'react';

type LazyDashboardVideoProps = {
  src: string;
  poster: string;
  className?: string;
};

export function LazyDashboardVideo({
  className,
  poster,
  src,
}: LazyDashboardVideoProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

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
      {
        rootMargin: '96px 0px',
      }
    );

    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} className="size-full">
      {shouldLoadVideo ? (
        <video
          src={src}
          poster={poster}
          className={className}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
        />
      ) : (
        <img
          src={poster}
          alt=""
          className={className}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}
