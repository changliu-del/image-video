import { CheckCircle2, CircleDollarSign, Clock, Rocket, TrendingUp } from 'lucide-react';
import { PricingTabs } from '@/components/marketing/pricing-tabs';
import {
  getMarketingContent,
  type Locale,
  type PricingPlan,
} from '@/lib/marketing/content';
import {
  CREDIT_PACKAGES,
  getEffectiveMonthlyAmount,
  getSubscriptionPlansByInterval,
} from '@/lib/payments/catalog';
import { getAmountForCredits } from '@/lib/payments/pricing';

type MarketingContent = ReturnType<typeof getMarketingContent>;
type PricingContent = MarketingContent['pricing'];

function formatCurrency(amount: number, currency: string, locale: Locale) {
  return new Intl.NumberFormat(locale === 'pt' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

function formatMonthlyCredits(credits: number, locale: Locale, billedYearly: boolean) {
  if (locale === 'pt') {
    return billedYearly
      ? `${credits} créditos por mês, cobrança anual`
      : `${credits} créditos por mês`;
  }

  return billedYearly
    ? `${credits} credits per month, billed yearly`
    : `${credits} credits per month`;
}

function formatOneTimeCredits(credits: number, locale: Locale) {
  return locale === 'pt'
    ? `${credits} créditos avulsos`
    : `${credits} one-time credits`;
}

function getCatalogBackedPricingPlans(plans: PricingPlan[], locale: Locale) {
  const monthlyPlans = getSubscriptionPlansByInterval('month');
  const yearlyPlans = getSubscriptionPlansByInterval('year');

  return plans.map((plan, index) => {
    const monthlyPlan = monthlyPlans[index];
    const yearlyPlan = yearlyPlans[index];
    const creditPackage = CREDIT_PACKAGES[index];

    if (!monthlyPlan || !yearlyPlan || !creditPackage) {
      return plan;
    }

    const listMonthlyAmount = getAmountForCredits(monthlyPlan.monthlyCredits);
    const monthlyOldPrice =
      listMonthlyAmount > monthlyPlan.unitAmount
        ? formatCurrency(listMonthlyAmount, monthlyPlan.currency, locale)
        : undefined;
    const yearlyMonthlyAmount = getEffectiveMonthlyAmount(yearlyPlan);
    const yearlyOldPrice =
      listMonthlyAmount > yearlyMonthlyAmount
        ? formatCurrency(listMonthlyAmount, yearlyPlan.currency, locale)
        : undefined;

    return {
      ...plan,
      yearly: {
        ...plan.yearly,
        oldPrice: yearlyOldPrice,
        price: formatCurrency(yearlyMonthlyAmount, yearlyPlan.currency, locale),
        credits: formatMonthlyCredits(yearlyPlan.monthlyCredits, locale, true),
      },
      monthly: {
        ...plan.monthly,
        oldPrice: monthlyOldPrice,
        price: formatCurrency(monthlyPlan.unitAmount, monthlyPlan.currency, locale),
        credits: formatMonthlyCredits(monthlyPlan.monthlyCredits, locale, false),
      },
      onetime: {
        ...plan.onetime,
        oldPrice: undefined,
        price: formatCurrency(creditPackage.unitAmount, creditPackage.currency, locale),
        credits: formatOneTimeCredits(creditPackage.credits, locale),
      },
    };
  });
}

function PricingHero({ content }: { content: PricingContent['hero'] }) {
  const badgeIcons = [Rocket, TrendingUp, Clock];

  return (
    <section className="relative overflow-hidden bg-gray-950 pb-28 pt-14 text-white md:pt-20">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#020617,#111827)]" />
      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-white/70 shadow-sm">
              <CircleDollarSign className="size-3.5 text-emerald-300" />
              {content.eyebrow}
            </div>
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-white md:text-6xl">
              {content.title}
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
              {content.description}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {content.badges.map((badge, index) => {
                const Icon = badgeIcons[index] ?? CheckCircle2;

                return (
                  <div
                    key={badge}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/75"
                  >
                    <Icon className="size-4 text-cyan-200" />
                    {badge}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-white/10 bg-white/10 shadow-2xl">
            {content.stats.map((stat) => (
              <div key={stat.label} className="bg-white/[0.06] p-5 backdrop-blur">
                <div className="text-3xl font-bold text-white">{stat.stat}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-white/45">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ValueSection({ content }: { content: PricingContent['value'] }) {
  return (
    <section className="bg-gray-950 py-20 text-white">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          {content.items.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-white/10 bg-white/[0.055] p-5"
            >
              <h2 className="font-semibold text-white">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/55">{item.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 grid gap-8 rounded-lg border border-white/10 bg-white/[0.055] p-6 md:grid-cols-2 md:p-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              {content.title}
            </h2>
            <ol className="mt-6 grid gap-4">
              {content.points.map((point, index) => (
                <li key={point} className="flex gap-3 text-sm leading-6 text-white/62">
                  <span className="flex size-7 flex-shrink-0 items-center justify-center rounded-full bg-white text-sm font-bold text-gray-950">
                    {index + 1}
                  </span>
                  {point}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
              {content.includedTitle}
            </h2>
            <ul className="mt-6 grid gap-4">
              {content.included.map((item) => (
                <li key={item} className="flex gap-3 text-sm leading-6 text-white/62">
                  <CheckCircle2 className="mt-0.5 size-5 flex-shrink-0 text-emerald-300" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingFaq({ content }: { content: PricingContent['faq'] }) {
  return (
    <section className="border-t border-white/10 bg-gray-900 py-20 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:px-8 lg:grid-cols-[0.7fr_1.3fr]">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          {content.title}
        </h2>
        <div className="grid gap-3">
          {content.items.map((item) => (
            <details
              key={item.question}
              className="group rounded-lg border border-white/10 bg-white/[0.055] px-5"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 font-medium text-white">
                {item.question}
                <span className="text-white/35 transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 text-sm leading-7 text-white/55">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MarketingPricingPage({ locale }: { locale: Locale }) {
  const content = getMarketingContent(locale).pricing;
  const plans = getCatalogBackedPricingPlans(content.plans, locale);

  return (
    <main className="bg-gray-950">
      <PricingHero content={content.hero} />
      <PricingTabs plans={plans} locale={locale} labels={content.tabs} />
      <ValueSection content={content.value} />
      <PricingFaq content={content.faq} />
    </main>
  );
}
