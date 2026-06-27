'use client';

import { LazyVideo } from '@/components/media/lazy-video';

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
  return (
    <LazyVideo
      src={src}
      poster={poster}
      className={className}
    />
  );
}
