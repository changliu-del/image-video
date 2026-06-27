'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ImageIcon,
  Shirt,
  Video,
  type LucideIcon,
} from 'lucide-react';

import { LazyDashboardVideo } from '@/components/dashboard/lazy-dashboard-video';

type WorkbenchCardKey = 'video' | 'product' | 'tryOn';

type WorkbenchCard = {
  key: WorkbenchCardKey;
  title: string;
  description: string;
  action: string;
  href: string;
  media: string;
};

type DashboardWorkbenchCardProps = {
  card: WorkbenchCard;
  poster: string;
};

const cardIcons = {
  video: Video,
  product: ImageIcon,
  tryOn: Shirt,
} satisfies Record<WorkbenchCardKey, LucideIcon>;

export function DashboardWorkbenchCard({
  card,
  poster,
}: DashboardWorkbenchCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const hasMeasuredInitialViewport = useRef(false);
  const shouldLoadWhenEnteringViewport = useRef(false);
  const [isPreviewArmed, setIsPreviewArmed] = useState(false);
  const Icon = cardIcons[card.key];

  const armPreview = useCallback(() => {
    setIsPreviewArmed(true);
  }, []);

  useEffect(() => {
    if (isPreviewArmed) return;

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
          setIsPreviewArmed(true);
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
  }, [isPreviewArmed]);

  return (
    <Link
      ref={cardRef}
      href={card.href}
      className="group flex min-h-[360px] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(79,70,229,0.13)]"
      onPointerEnter={armPreview}
      onFocusCapture={armPreview}
      onTouchStart={armPreview}
    >
      <div className="relative h-44 overflow-hidden bg-gray-100">
        <LazyDashboardVideo
          active={isPreviewArmed}
          src={card.media}
          poster={poster}
          className="size-full object-cover transition duration-500 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className="flex size-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <Icon className="size-5" />
        </span>
        <h2 className="mt-5 text-xl font-black text-gray-950">{card.title}</h2>
        <p className="mt-3 min-h-12 text-sm font-semibold leading-6 text-gray-500">
          {card.description}
        </p>
        <span className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-bold text-indigo-600">
          {card.action}
          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
