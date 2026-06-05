'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useActionState, useState } from 'react';
import {
  CreditCard,
  Eye,
  EyeOff,
  Gift,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Send,
  ShieldCheck,
  Sparkles,
  Video,
} from 'lucide-react';
import { sendSignupVerificationCode, signIn, signUp } from './actions';
import type { ActionState } from '@/lib/auth/middleware';
import {
  getLocalizedHref,
  getMarketingContent,
  type Locale,
} from '@/lib/marketing/content';
import { cn } from '@/lib/utils';

type AuthMode = 'signin' | 'signup';
type AuthContent = ReturnType<typeof getMarketingContent>['auth'];

const benefitIcons = [Sparkles, Video, Gift, ShieldCheck, CreditCard];

function getModeFromSearch(
  searchParams: ReturnType<typeof useSearchParams>,
  fallback: AuthMode
) {
  const requestedMode = searchParams.get('mode');

  if (
    requestedMode === 'signup' ||
    requestedMode === 'register' ||
    requestedMode === 'sign-up'
  ) {
    return 'signup';
  }

  return fallback;
}

function getModeHref(
  locale: Locale,
  searchParams: ReturnType<typeof useSearchParams>,
  mode: AuthMode
) {
  const params = new URLSearchParams(searchParams.toString());
  params.delete('invite');
  params.delete('inviteId');
  params.delete('inviteCode');

  if (mode === 'signup') {
    params.set('mode', 'signup');
  } else {
    params.delete('mode');
  }

  const query = params.toString();
  return `${getLocalizedHref(locale, '/login')}${query ? `?${query}` : ''}`;
}

function getAuthError(content: AuthContent, error?: string) {
  if (!error) {
    return null;
  }

  const normalizedError = error.toLowerCase();

  if (normalizedError.includes('invalid email or password')) {
    return content.errors.invalidCredentials;
  }

  if (normalizedError.includes('failed to create user')) {
    return content.errors.registerFailed;
  }

  if (
    normalizedError.includes('verification code') ||
    normalizedError.includes('verification email')
  ) {
    return content.errors.invalidVerificationCode;
  }

  if (normalizedError.includes('too many attempts')) {
    return content.errors.rateLimited;
  }

  if (normalizedError.includes('invalid email')) {
    return content.errors.invalidEmail;
  }

  if (
    normalizedError.includes('at least 8') ||
    normalizedError.includes('too small')
  ) {
    return content.errors.weakPassword;
  }

  return content.errors.fallback;
}

function BrandLockup() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-lg bg-white text-lg font-black text-gray-950">
        g
      </span>
      <div>
        <p className="text-lg font-semibold leading-tight text-white">gptimage</p>
        <p className="text-xs text-white/45">AI Commerce Studio</p>
      </div>
    </div>
  );
}

function AuthTabs({
  activeMode,
  content,
  locale,
  searchParams,
}: {
  activeMode: AuthMode;
  content: AuthContent;
  locale: Locale;
  searchParams: ReturnType<typeof useSearchParams>;
}) {
  const tabs: { mode: AuthMode; label: string }[] = [
    { mode: 'signin', label: content.loginTab },
    { mode: 'signup', label: content.registerTab },
  ];

  return (
    <div
      aria-label="Auth mode"
      className="inline-flex rounded-xl bg-white/10 p-1"
      role="tablist"
    >
      {tabs.map((tab) => {
        const selected = tab.mode === activeMode;

        return (
          <Link
            key={tab.mode}
            href={getModeHref(locale, searchParams, tab.mode)}
            role="tab"
            aria-selected={selected}
            className={cn(
              'flex h-10 min-w-28 items-center justify-center rounded-lg px-4 text-sm font-medium transition',
              selected
                ? 'bg-white text-gray-950 shadow-sm'
                : 'text-white/60 hover:bg-white/[0.06] hover:text-white'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export function Login({
  mode = 'signin',
  locale = 'pt',
}: {
  mode?: AuthMode;
  locale?: Locale;
}) {
  const content = getMarketingContent(locale).auth;
  const searchParams = useSearchParams();
  const activeMode = getModeFromSearch(searchParams, mode);
  const redirect = searchParams.get('redirect');
  const priceId = searchParams.get('priceId');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [signInState, signInAction, signInPending] = useActionState<
    ActionState,
    FormData
  >(signIn, { error: '' });
  const [signUpState, signUpAction, signUpPending] = useActionState<
    ActionState,
    FormData
  >(signUp, { error: '' });
  const [sendCodeState, sendCodeAction, sendCodePending] = useActionState<
    ActionState,
    FormData
  >(sendSignupVerificationCode, { error: '' });
  const state = activeMode === 'signin' ? signInState : signUpState;
  const pending = activeMode === 'signin' ? signInPending : signUpPending;
  const formAction = activeMode === 'signin' ? signInAction : signUpAction;
  const authError =
    getAuthError(content, state.error) ||
    (activeMode === 'signup'
      ? getAuthError(content, sendCodeState.error)
      : null);
  const emailDefaultValue =
    activeMode === 'signup'
      ? signUpState.email ?? sendCodeState.email
      : signInState.email;
  const switchMode = activeMode === 'signin' ? 'signup' : 'signin';

  return (
    <main className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-gray-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_80%_18%,rgba(245,158,11,0.14),transparent_28%),linear-gradient(135deg,#020617,#111827_55%,#030712)]" />
      <div className="relative mx-auto flex min-h-[calc(100vh-72px)] max-w-7xl items-center justify-center px-4 py-10 md:px-8">
        <section className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/30 backdrop-blur md:grid-cols-[0.9fr_1.1fr]">
          <div className="hidden border-r border-white/10 bg-white/[0.04] p-10 text-white md:flex md:flex-col md:justify-between">
            <div>
              <BrandLockup />
              <h1 className="mt-8 max-w-xs text-3xl font-bold leading-tight text-white">
                {content.title}
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-white/58">
                {content.subtitle}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                {content.benefits.map((benefit, index) => {
                  const BenefitIcon = benefitIcons[index] ?? Sparkles;

                  return (
                    <div
                      key={benefit}
                      className="flex min-h-16 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/70"
                    >
                      <BenefitIcon className="size-4 flex-shrink-0 text-white/38" />
                      <span>{benefit}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-10 h-32 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
              <video
                src="/bg.mp4"
                className="h-full w-full object-cover opacity-80"
                autoPlay
                loop
                muted
                playsInline
              />
            </div>
          </div>

          <div className="p-5 text-white sm:p-8 md:p-10">
            <div className="mb-7 md:hidden">
              <div className="mb-5">
                <BrandLockup />
              </div>
              <h1 className="text-2xl font-bold text-white">{content.title}</h1>
              <p className="mt-2 text-sm leading-6 text-white/55">
                {content.subtitle}
              </p>
            </div>

            <AuthTabs
              activeMode={activeMode}
              content={content}
              locale={locale}
              searchParams={searchParams}
            />

            <form className="mt-7 space-y-5" action={formAction}>
              <input type="hidden" name="redirect" value={redirect || ''} />
              <input type="hidden" name="priceId" value={priceId || ''} />
              <input type="hidden" name="locale" value={locale} />

              <label className="block" htmlFor="email">
                <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/45">
                  {content.emailLabel}
                </span>
                <span className="flex h-12 items-center rounded-xl border border-white/10 bg-white/[0.07] px-3 transition-colors focus-within:border-white/55 focus-within:ring-2 focus-within:ring-white/10">
                  <Mail className="mr-3 size-4 flex-shrink-0 text-white/38" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    defaultValue={emailDefaultValue}
                    required
                    maxLength={255}
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                    placeholder={content.emailPlaceholder}
                  />
                </span>
              </label>

              <label className="block" htmlFor="password">
                <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/45">
                  {content.passwordLabel}
                </span>
                <span className="flex h-12 items-center rounded-xl border border-white/10 bg-white/[0.07] px-3 transition-colors focus-within:border-white/55 focus-within:ring-2 focus-within:ring-white/10">
                  <Lock className="mr-3 size-4 flex-shrink-0 text-white/38" />
                  <input
                    id="password"
                    name="password"
                    type={passwordVisible ? 'text' : 'password'}
                    autoComplete={
                      activeMode === 'signin'
                        ? 'current-password'
                        : 'new-password'
                    }
                    required
                    minLength={activeMode === 'signin' ? 1 : 8}
                    maxLength={100}
                    className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                    placeholder={content.passwordPlaceholder}
                  />
                  <button
                    type="button"
                    aria-label={
                      passwordVisible
                        ? content.hidePassword
                        : content.showPassword
                    }
                    onClick={() => setPasswordVisible((value) => !value)}
                    className="ml-2 rounded-md p-1 text-white/40 transition-colors hover:text-white"
                  >
                    {passwordVisible ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </span>
              </label>

              {activeMode === 'signup' ? (
                <label className="block" htmlFor="verificationCode">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-white/45">
                    {content.verificationCodeLabel}
                  </span>
                  <span className="flex h-12 items-center rounded-xl border border-white/10 bg-white/[0.07] px-3 transition-colors focus-within:border-white/55 focus-within:ring-2 focus-within:ring-white/10">
                    <KeyRound className="mr-3 size-4 flex-shrink-0 text-white/38" />
                    <input
                      id="verificationCode"
                      name="verificationCode"
                      type="text"
                      autoComplete="one-time-code"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      required
                      className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/30"
                      placeholder={content.verificationCodePlaceholder}
                    />
                    <button
                      type="submit"
                      formAction={sendCodeAction}
                      formNoValidate
                      disabled={sendCodePending}
                      className="ml-2 inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-md bg-white/12 px-2 text-xs font-semibold text-white transition hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3"
                    >
                      {sendCodePending ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Send className="size-3.5" />
                      )}
                      <span className="hidden sm:inline">
                        {sendCodePending
                          ? content.sendingVerificationCode
                          : content.sendVerificationCode}
                      </span>
                    </button>
                  </span>
                </label>
              ) : null}

              {authError ? (
                <div
                  className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-100"
                  role="alert"
                >
                  {authError}
                </div>
              ) : null}

              {activeMode === 'signup' &&
              sendCodeState.success &&
              !authError ? (
                <div
                  className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100"
                  role="status"
                >
                  {content.verificationCodeSent}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-gray-950 transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {content.loading}
                  </>
                ) : activeMode === 'signin' ? (
                  content.signIn
                ) : (
                  content.register
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-white/50">
              {activeMode === 'signin'
                ? content.switchToRegisterPrompt
                : content.switchToLoginPrompt}{' '}
              <Link
                href={getModeHref(locale, searchParams, switchMode)}
                className="font-semibold text-white transition hover:text-white/80"
              >
                {activeMode === 'signin'
                  ? content.switchToRegister
                  : content.switchToLogin}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
