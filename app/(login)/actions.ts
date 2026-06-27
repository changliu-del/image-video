'use server';

import { createHmac, randomInt, timingSafeEqual } from 'crypto';
import { z } from 'zod';
import { and, desc, eq, gt, isNull, ne, sql } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import {
  User,
  users,
  creditLedger,
  emailVerificationCodes,
  type NewUser,
} from '@/lib/db/schema';
import { comparePasswords, hashPassword } from '@/lib/auth/password';
import {
  buildAuthRateLimitKey,
  consumeRateLimits,
  getRequestRateLimitIdentity,
} from '@/lib/auth/rate-limit';
import { sendSignupVerificationCodeEmail } from '@/lib/email/signup-verification';
import { setSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSignupFreeCreditsAmount } from '@/lib/generations/free-credits';
import { createCheckoutSession } from '@/lib/payments/stripe';
import { getUser } from '@/lib/db/queries';
import { withDashboardLocale } from '@/lib/dashboard/locale-url';
import {
  validatedAction,
  validatedActionWithUser
} from '@/lib/auth/middleware';

function isSafeLocalRedirect(value: string | null | undefined) {
  return Boolean(value && value.startsWith('/') && !value.startsWith('//'));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

type ActionLocale = 'en' | 'pt' | 'zh';

function getActionLocale(formData: FormData): ActionLocale {
  const locale = formData.get('locale');
  if (locale === 'pt' || locale === 'zh') return locale;
  return 'en';
}

const accountActionCopy: Record<
  ActionLocale,
  {
    currentPasswordIncorrect: string;
    passwordUnchanged: string;
    passwordMismatch: string;
    passwordUpdated: string;
    accountDeletionFailed: string;
    emailInUse: string;
    accountUpdated: string;
  }
> = {
  pt: {
    currentPasswordIncorrect: 'A senha atual está incorreta.',
    passwordUnchanged: 'A nova senha deve ser diferente da senha atual.',
    passwordMismatch: 'A nova senha e a confirmação não correspondem.',
    passwordUpdated: 'Senha atualizada com sucesso.',
    accountDeletionFailed: 'Senha incorreta. Não foi possível excluir a conta.',
    emailInUse: 'Este e-mail já está em uso.',
    accountUpdated: 'Conta atualizada com sucesso.',
  },
  en: {
    currentPasswordIncorrect: 'Current password is incorrect.',
    passwordUnchanged: 'New password must be different from the current password.',
    passwordMismatch: 'New password and confirmation password do not match.',
    passwordUpdated: 'Password updated successfully.',
    accountDeletionFailed: 'Incorrect password. Account deletion failed.',
    emailInUse: 'Email is already in use.',
    accountUpdated: 'Account updated successfully.',
  },
  zh: {
    currentPasswordIncorrect: '当前密码不正确。',
    passwordUnchanged: '新密码必须与当前密码不同。',
    passwordMismatch: '新密码和确认密码不一致。',
    passwordUpdated: '密码更新成功。',
    accountDeletionFailed: '密码不正确，账户删除失败。',
    emailInUse: '该邮箱已被使用。',
    accountUpdated: '账户更新成功。',
  },
};

async function consumeSignInLimit(email: string) {
  const identity = await getRequestRateLimitIdentity();
  return consumeRateLimits([
    {
      key: buildAuthRateLimitKey('sign-in', 'ip-email', identity.ip, email),
      limit: 8,
      windowMs: 10 * 60 * 1000,
      blockMs: 15 * 60 * 1000,
    },
    {
      key: buildAuthRateLimitKey('sign-in', 'ip', identity.ip),
      limit: 40,
      windowMs: 10 * 60 * 1000,
      blockMs: 15 * 60 * 1000,
    },
  ]);
}

async function consumeSignUpLimit(email: string) {
  const identity = await getRequestRateLimitIdentity();
  return consumeRateLimits([
    {
      key: buildAuthRateLimitKey('sign-up', 'ip-email', identity.ip, email),
      limit: 10,
      windowMs: 15 * 60 * 1000,
      blockMs: 15 * 60 * 1000,
    },
    {
      key: buildAuthRateLimitKey('sign-up', 'ip', identity.ip),
      limit: 40,
      windowMs: 15 * 60 * 1000,
      blockMs: 15 * 60 * 1000,
    },
    {
      key: buildAuthRateLimitKey('sign-up', 'email', email),
      limit: 20,
      windowMs: 60 * 60 * 1000,
      blockMs: 60 * 60 * 1000,
    },
    {
      key: buildAuthRateLimitKey('sign-up', 'ip-daily', identity.ip),
      limit: 20,
      windowMs: 24 * 60 * 60 * 1000,
      blockMs: 24 * 60 * 60 * 1000,
    },
  ]);
}

async function consumeSignupVerificationCodeRequestLimit(email: string) {
  const identity = await getRequestRateLimitIdentity();
  return consumeRateLimits([
    {
      key: buildAuthRateLimitKey(
        'sign-up-code-request',
        'ip-email',
        identity.ip,
        email
      ),
      limit: 3,
      windowMs: 15 * 60 * 1000,
      blockMs: 15 * 60 * 1000,
    },
    {
      key: buildAuthRateLimitKey('sign-up-code-request', 'email', email),
      limit: 6,
      windowMs: 60 * 60 * 1000,
      blockMs: 60 * 60 * 1000,
    },
    {
      key: buildAuthRateLimitKey('sign-up-code-request', 'email-daily', email),
      limit: 12,
      windowMs: 24 * 60 * 60 * 1000,
      blockMs: 24 * 60 * 60 * 1000,
    },
    {
      key: buildAuthRateLimitKey('sign-up-code-request', 'ip', identity.ip),
      limit: 30,
      windowMs: 60 * 60 * 1000,
      blockMs: 60 * 60 * 1000,
    },
  ]);
}

async function consumeSignupVerificationAttemptLimit(email: string) {
  const identity = await getRequestRateLimitIdentity();
  return consumeRateLimits([
    {
      key: buildAuthRateLimitKey(
        'sign-up-code-verify',
        'ip-email',
        identity.ip,
        email
      ),
      limit: 10,
      windowMs: 15 * 60 * 1000,
      blockMs: 15 * 60 * 1000,
    },
    {
      key: buildAuthRateLimitKey('sign-up-code-verify', 'email', email),
      limit: 20,
      windowMs: 60 * 60 * 1000,
      blockMs: 60 * 60 * 1000,
    },
    {
      key: buildAuthRateLimitKey('sign-up-code-verify', 'ip', identity.ip),
      limit: 40,
      windowMs: 15 * 60 * 1000,
      blockMs: 15 * 60 * 1000,
    },
  ]);
}

function rateLimitError() {
  return 'Too many attempts. Please wait and try again.';
}

const SIGNUP_VERIFICATION_PURPOSE = 'signup';
const SIGNUP_VERIFICATION_CODE_TTL_MS = 10 * 60 * 1000;
const SIGNUP_VERIFICATION_CODE_TTL_MINUTES =
  SIGNUP_VERIFICATION_CODE_TTL_MS / 60 / 1000;
const SIGNUP_VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000;
const SIGNUP_VERIFICATION_MAX_ATTEMPTS = 5;
const SIGNUP_VERIFICATION_SENT_MESSAGE =
  'If this email can create an account, we sent a verification code.';
const SIGNUP_VERIFICATION_INVALID_MESSAGE =
  'Verification code is invalid or expired.';

function normalizeVerificationCode(code: string) {
  return code.trim().replace(/\s+/g, '');
}

function getVerificationSecret() {
  const secret =
    process.env.EMAIL_VERIFICATION_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim();

  if (!secret) {
    throw new Error('AUTH_SECRET is required for signup verification codes.');
  }

  return secret;
}

function hashSignupVerificationCode(email: string, code: string) {
  return createHmac('sha256', getVerificationSecret())
    .update(`${SIGNUP_VERIFICATION_PURPOSE}:${email}:${code}`)
    .digest('hex');
}

function verificationCodeHashesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left, 'hex');
  const rightBuffer = Buffer.from(right, 'hex');

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function getConfiguredDevVerificationCode() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const code = process.env.SIGNUP_VERIFICATION_DEV_CODE?.trim();
  return code && /^\d{6}$/.test(code) ? code : null;
}

function generateSignupVerificationCode() {
  return (
    getConfiguredDevVerificationCode() ??
    String(randomInt(1_000_000)).padStart(6, '0')
  );
}

async function findExistingUserByEmail(email: string) {
  return db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email}`)
    .limit(1);
}

const signInSchema = z.object({
  email: z.string().trim().email().min(3).max(255).transform(normalizeEmail),
  password: z.string().min(1).max(100)
});

export const signIn = validatedAction(signInSchema, async (data, formData) => {
  const { email, password } = data;
  const locale = formData.get('locale')?.toString();
  const rateLimit = await consumeSignInLimit(email);

  if (!rateLimit.allowed) {
    return {
      error: rateLimitError(),
      email,
    };
  }

  const foundUsers = await db
    .select()
    .from(users)
    .where(and(sql`lower(${users.email}) = ${email}`, isNull(users.deletedAt)))
    .limit(1);

  const foundUser = foundUsers[0];

  if (!foundUser) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
    };
  }

  const isPasswordValid = await comparePasswords(
    password,
    foundUser.passwordHash
  );

  if (!isPasswordValid) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
    };
  }

  await setSession(foundUser);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ priceId, locale });
  }

  if (isSafeLocalRedirect(redirectTo)) {
    redirect(redirectTo!);
  }

  redirect(withDashboardLocale('/dashboard', locale));
});

async function getLatestActiveSignupVerificationCode(email: string) {
  const now = new Date();
  const [record] = await db
    .select()
    .from(emailVerificationCodes)
    .where(
      and(
        eq(emailVerificationCodes.email, email),
        eq(emailVerificationCodes.purpose, SIGNUP_VERIFICATION_PURPOSE),
        isNull(emailVerificationCodes.consumedAt),
        gt(emailVerificationCodes.expiresAt, now)
      )
    )
    .orderBy(desc(emailVerificationCodes.createdAt))
    .limit(1);

  return record ?? null;
}

const sendSignupVerificationCodeSchema = z.object({
  email: z.string().trim().email().min(3).max(255).transform(normalizeEmail),
});

export const sendSignupVerificationCode = validatedAction(
  sendSignupVerificationCodeSchema,
  async ({ email }, formData) => {
    const locale = formData.get('locale')?.toString();
    const rateLimit = await consumeSignupVerificationCodeRequestLimit(email);

    if (!rateLimit.allowed) {
      return {
        error: rateLimitError(),
        email,
      };
    }

    const existingUser = await findExistingUserByEmail(email);
    if (existingUser[0]) {
      return {
        success: SIGNUP_VERIFICATION_SENT_MESSAGE,
        email,
      };
    }

    const latestCode = await getLatestActiveSignupVerificationCode(email);
    if (
      latestCode &&
      Date.now() - latestCode.lastSentAt.getTime() <
        SIGNUP_VERIFICATION_RESEND_COOLDOWN_MS
    ) {
      return {
        success: SIGNUP_VERIFICATION_SENT_MESSAGE,
        email,
      };
    }

    const code = generateSignupVerificationCode();
    const now = new Date();
    const expiresAt = new Date(Date.now() + SIGNUP_VERIFICATION_CODE_TTL_MS);
    const [createdCode] = await db.transaction(async (tx) => {
      await tx
        .update(emailVerificationCodes)
        .set({
          consumedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(emailVerificationCodes.email, email),
            eq(emailVerificationCodes.purpose, SIGNUP_VERIFICATION_PURPOSE),
            isNull(emailVerificationCodes.consumedAt)
          )
        );

      return tx
        .insert(emailVerificationCodes)
        .values({
          email,
          purpose: SIGNUP_VERIFICATION_PURPOSE,
          codeHash: hashSignupVerificationCode(email, code),
          expiresAt,
          lastSentAt: now,
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: emailVerificationCodes.id });
    });

    const devCode = getConfiguredDevVerificationCode();
    const delivery = devCode
      ? { delivered: true }
      : await sendSignupVerificationCodeEmail({
          to: email,
          code,
          expiresInMinutes: SIGNUP_VERIFICATION_CODE_TTL_MINUTES,
          locale,
        });

    if (!delivery.delivered && createdCode) {
      await db
        .update(emailVerificationCodes)
        .set({
          consumedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(emailVerificationCodes.id, createdCode.id));
    }

    return {
      success: SIGNUP_VERIFICATION_SENT_MESSAGE,
      email,
    };
  }
);

async function verifySignupVerificationCode(input: {
  email: string;
  code: string;
}) {
  const rateLimit = await consumeSignupVerificationAttemptLimit(input.email);
  if (!rateLimit.allowed) {
    return {
      ok: false as const,
      error: rateLimitError(),
    };
  }

  const normalizedCode = normalizeVerificationCode(input.code);
  const record = await getLatestActiveSignupVerificationCode(input.email);

  if (!record || record.attempts >= SIGNUP_VERIFICATION_MAX_ATTEMPTS) {
    return {
      ok: false as const,
      error: SIGNUP_VERIFICATION_INVALID_MESSAGE,
    };
  }

  const expectedHash = hashSignupVerificationCode(input.email, normalizedCode);
  if (!verificationCodeHashesMatch(record.codeHash, expectedHash)) {
    const now = new Date();
    const nextAttempts = record.attempts + 1;
    const updateValues =
      nextAttempts >= SIGNUP_VERIFICATION_MAX_ATTEMPTS
        ? {
            attempts: sql`${emailVerificationCodes.attempts} + 1`,
            consumedAt: now,
            updatedAt: now,
          }
        : {
            attempts: sql`${emailVerificationCodes.attempts} + 1`,
            updatedAt: now,
          };

    await db
      .update(emailVerificationCodes)
      .set(updateValues)
      .where(eq(emailVerificationCodes.id, record.id));

    return {
      ok: false as const,
      error: SIGNUP_VERIFICATION_INVALID_MESSAGE,
    };
  }

  return {
    ok: true as const,
    verificationId: record.id,
  };
}

const signUpSchema = z.object({
  email: z.string().trim().email().min(3).max(255).transform(normalizeEmail),
  password: z.string().min(8).max(100),
  verificationCode: z
    .string({ required_error: SIGNUP_VERIFICATION_INVALID_MESSAGE })
    .trim()
    .transform(normalizeVerificationCode)
    .refine((code) => /^\d{6}$/.test(code), {
      message: 'Verification code is invalid or expired.',
    }),
});

export const signUp = validatedAction(signUpSchema, async (data, formData) => {
  const { email, password, verificationCode } = data;
  const locale = formData.get('locale')?.toString();
  const rateLimit = await consumeSignUpLimit(email);

  if (!rateLimit.allowed) {
    return {
      error: rateLimitError(),
      email,
    };
  }

  const existingUser = await findExistingUserByEmail(email);

  if (existingUser.length > 0) {
    return {
      error: 'Failed to create user. Please try again.',
      email,
    };
  }

  const verificationResult = await verifySignupVerificationCode({
    email,
    code: verificationCode,
  });

  if (!verificationResult.ok) {
    return {
      error: verificationResult.error,
      email,
    };
  }

  const passwordHash = await hashPassword(password);

  const newUser: NewUser = {
    email,
    passwordHash,
    role: 'member'
  };

  let signUpResult: {
    createdUser: User;
  };

  try {
    signUpResult = await db.transaction(async (tx) => {
      const now = new Date();
      const [consumedCode] = await tx
        .update(emailVerificationCodes)
        .set({
          consumedAt: now,
          updatedAt: now,
        })
        .where(
          and(
            eq(emailVerificationCodes.id, verificationResult.verificationId),
            isNull(emailVerificationCodes.consumedAt),
            gt(emailVerificationCodes.expiresAt, now)
          )
        )
        .returning({ id: emailVerificationCodes.id });

      if (!consumedCode) {
        throw new Error(SIGNUP_VERIFICATION_INVALID_MESSAGE);
      }

      const existingUserInTransaction = await tx
        .select({ id: users.id })
        .from(users)
        .where(sql`lower(${users.email}) = ${email}`)
        .limit(1);

      if (existingUserInTransaction[0]) {
        throw new Error('Failed to create user');
      }

      const freeCredits = getSignupFreeCreditsAmount();
      const [createdUser] = await tx
        .insert(users)
        .values({
          ...newUser,
          creditBalance: freeCredits
        })
        .returning();

      if (!createdUser) {
        throw new Error('Failed to create user');
      }

      await tx.insert(creditLedger).values({
        userId: createdUser.id,
        delta: freeCredits,
        reason: 'admin_adjust',
        balanceAfter: freeCredits,
        metadataJson: {
          source: 'signup_free_credits',
          credits: freeCredits
        }
      });

      return { createdUser };
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === SIGNUP_VERIFICATION_INVALID_MESSAGE
    ) {
      return {
        error: SIGNUP_VERIFICATION_INVALID_MESSAGE,
        email,
      };
    }

    return {
      error: 'Failed to create user. Please try again.',
      email,
    };
  }

  const { createdUser } = signUpResult;
  await setSession(createdUser);

  const redirectTo = formData.get('redirect') as string | null;
  if (redirectTo === 'checkout') {
    const priceId = formData.get('priceId') as string;
    return createCheckoutSession({ priceId, locale });
  }

  if (isSafeLocalRedirect(redirectTo)) {
    redirect(redirectTo!);
  }

  redirect(withDashboardLocale('/dashboard', locale));
});

export async function signOut() {
  (await cookies()).delete('session');
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100)
});

export const updatePassword = validatedActionWithUser(
  updatePasswordSchema,
  async (data, formData, user) => {
    const copy = accountActionCopy[getActionLocale(formData)];
    const { currentPassword, newPassword, confirmPassword } = data;

    const isPasswordValid = await comparePasswords(
      currentPassword,
      user.passwordHash
    );

    if (!isPasswordValid) {
      return {
        error: copy.currentPasswordIncorrect
      };
    }

    if (currentPassword === newPassword) {
      return {
        error: copy.passwordUnchanged
      };
    }

    if (confirmPassword !== newPassword) {
      return {
        error: copy.passwordMismatch
      };
    }

    const newPasswordHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({ passwordHash: newPasswordHash, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    return {
      success: copy.passwordUpdated
    };
  }
);

const deleteAccountSchema = z.object({
  password: z.string().min(8).max(100)
});

export const deleteAccount = validatedActionWithUser(
  deleteAccountSchema,
  async (data, formData, user) => {
    const locale = getActionLocale(formData);
    const copy = accountActionCopy[locale];
    const { password } = data;

    const isPasswordValid = await comparePasswords(password, user.passwordHash);
    if (!isPasswordValid) {
      return {
        error: copy.accountDeletionFailed
      };
    }

    await db
      .update(users)
      .set({
        deletedAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
        email: sql`CONCAT(email, '-', id, '-deleted')` // Ensure email uniqueness
      })
      .where(eq(users.id, user.id));

    (await cookies()).delete('session');
    redirect(withDashboardLocale('/sign-in', locale));
  }
);

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .max(255)
    .transform(normalizeEmail)
});

export const updateAccount = validatedActionWithUser(
  updateAccountSchema,
  async (data, formData, user) => {
    const copy = accountActionCopy[getActionLocale(formData)];
    const { name, email } = data;
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(and(sql`lower(${users.email}) = ${email}`, ne(users.id, user.id)))
      .limit(1);

    if (existingUser[0]) {
      return {
        name,
        error: copy.emailInUse
      };
    }

    await db
      .update(users)
      .set({ name, email, updatedAt: new Date() })
      .where(eq(users.id, user.id));

    return { name, success: copy.accountUpdated };
  }
);
