'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, Layers, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { type PricingPlan } from '@/lib/marketing/content';
import { cn } from '@/lib/utils';

type Billing = 'yearly' | 'monthly' | 'onetime';

type PricingTabsProps = {
  plans: PricingPlan[];
  labels: {
    yearly: string;
    monthly: string;
    onetime: string;
    save: string;
    secure: string;
    buy: string;
    popular: string;
    perMonth: string;
  };
};

const planIcons = [Layers, Zap, Sparkles];

export function PricingTabs({ plans, labels }: PricingTabsProps) {
  const [billing, setBilling] = useState<Billing>('yearly');
  const tabs: { key: Billing; label: string; badge?: string }[] = [
    { key: 'yearly', label: labels.yearly, badge: labels.save },
    { key: 'monthly', label: labels.monthly },
    { key: 'onetime', label: labels.onetime },
  ];

  return (
    <div className="mx-auto -mt-20 max-w-7xl px-4 md:px-8">
      <div className="rounded-lg border border-white/10 bg-white/[0.06] p-4 shadow-2xl backdrop-blur md:p-6">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex max-w-full gap-2 overflow-x-auto rounded-full border border-white/10 bg-white/10 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setBilling(tab.key)}
                className={cn(
                  'inline-flex h-10 flex-shrink-0 items-center gap-2 rounded-full px-4 text-sm transition',
                  billing === tab.key
                    ? 'bg-white text-gray-950'
                    : 'text-white/60 hover:text-white'
                )}
              >
                <span>{tab.label}</span>
                {tab.badge ? (
                  <span
                    className={cn(
                      'rounded-full px-2 py-1 text-xs',
                      billing === tab.key
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-emerald-400/15 text-emerald-200'
                    )}
                  >
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/75">
            <ShieldCheck className="size-4 text-emerald-300" />
            {labels.secure}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {plans.map((plan, index) => {
            const Icon = planIcons[index] ?? Layers;
            const price = plan[billing];
            const showMonthlyLabel = billing !== 'onetime';

            return (
              <div
                key={plan.name}
                className={cn(
                  'relative overflow-hidden rounded-lg border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-2xl',
                  plan.highlighted
                    ? 'border-cyan-300/50 bg-white/[0.09]'
                    : 'border-white/10 bg-white/[0.055]'
                )}
              >
                {plan.highlighted ? (
                  <div className="absolute right-4 top-4 rounded-full bg-cyan-300 px-3 py-1 text-xs font-semibold text-gray-950">
                    {labels.popular}
                  </div>
                ) : null}
                <div className="mb-8">
                  <div className="mb-4 flex size-11 items-center justify-center rounded-lg bg-white/10">
                    <Icon className="size-5 text-cyan-200" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-white/52">
                    {plan.description}
                  </p>
                </div>
                <div className="mb-8">
                  <div className="flex items-end gap-2">
                    {'oldPrice' in price && price.oldPrice ? (
                      <span className="pb-1 text-lg text-white/35 line-through">
                        {price.oldPrice}
                      </span>
                    ) : null}
                    <span className="text-5xl font-bold tracking-tight text-white">
                      {price.price}
                    </span>
                  </div>
                  {showMonthlyLabel ? (
                    <p className="mt-2 text-sm text-white/42">{labels.perMonth}</p>
                  ) : null}
                  <p className="mt-4 text-sm font-medium text-cyan-100">
                    {price.credits}
                  </p>
                </div>
                <ul className="mb-8 grid gap-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-white/65">
                      <Check className="mt-0.5 size-4 flex-shrink-0 text-emerald-300" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/sign-in"
                  className={cn(
                    'inline-flex h-11 w-full items-center justify-center rounded-lg text-sm font-semibold transition',
                    plan.highlighted
                      ? 'bg-cyan-300 text-gray-950 hover:bg-cyan-200'
                      : 'bg-white text-gray-950 hover:bg-white/90'
                  )}
                >
                  {labels.buy}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
