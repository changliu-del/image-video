'use client';

import { MediaOutlet, MediaPlayer } from '@vidstack/react';

import { cn } from '@/lib/utils';

type VideoFit = 'contain' | 'cover';

export function VideoPlayer({
  className,
  fit = 'contain',
  mediaClassName,
  muted = false,
  preload = 'metadata',
  src,
  title,
}: {
  className?: string;
  fit?: VideoFit;
  mediaClassName?: string;
  muted?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  src: string;
  title?: string;
}) {
  return (
    <MediaPlayer
      className={cn('iv-video-player', className)}
      controls
      data-video-fit={fit}
      muted={muted}
      playsinline
      preload={preload}
      src={src}
      title={title}
    >
      <MediaOutlet className={cn('iv-video-player__outlet', mediaClassName)} />
    </MediaPlayer>
  );
}
