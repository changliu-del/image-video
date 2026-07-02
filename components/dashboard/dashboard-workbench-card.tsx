'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ImageIcon,
  Shirt,
  Video,
  type LucideIcon,
} from 'lucide-react';

import { markCreateVideoNavigationClick } from '@/lib/performance/create-video-navigation';

type WorkbenchCardKey = 'video' | 'product' | 'tryOn';

type WorkbenchCard = {
  key: WorkbenchCardKey;
  title: string;
  description: string;
  action: string;
  href: string;
};

type DashboardWorkbenchCardProps = {
  card: WorkbenchCard;
};

const cardIcons = {
  video: Video,
  product: ImageIcon,
  tryOn: Shirt,
} satisfies Record<WorkbenchCardKey, LucideIcon>;

export function DashboardWorkbenchCard({ card }: DashboardWorkbenchCardProps) {
  const Icon = cardIcons[card.key];

  const markNavigationClick = useCallback(() => {
    if (card.key !== 'video') return;

    markCreateVideoNavigationClick({
      href: card.href,
      origin: 'dashboard-card',
    });
  }, [card.href, card.key]);

  return (
    <Link
      href={card.href}
      prefetch={false}
      className="group flex min-h-[244px] flex-col rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_42px_rgba(79,70,229,0.13)]"
      onClick={markNavigationClick}
    >
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
    </Link>
  );
}
