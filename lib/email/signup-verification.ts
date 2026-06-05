import 'server-only';

import { Resend } from 'resend';

import { captureException } from '@/lib/observability/sentry';
import type { Locale } from '@/lib/marketing/content';

type SignupVerificationEmailInput = {
  to: string;
  code: string;
  expiresInMinutes: number;
  locale?: string | null;
};

type SignupVerificationEmailResult = {
  delivered: boolean;
  messageId?: string;
  skippedReason?: 'missing_config' | 'send_failed';
};

const EMAIL_BRAND = 'gptimage';

export async function sendSignupVerificationCodeEmail(
  input: SignupVerificationEmailInput
): Promise<SignupVerificationEmailResult> {
  const config = getEmailConfig();
  if (!config) {
    return { delivered: false, skippedReason: 'missing_config' };
  }

  const copy = getVerificationCopy(input.locale);

  try {
    const resend = new Resend(config.apiKey);
    const result = await resend.emails.send({
      from: config.from,
      to: input.to,
      subject: copy.subject,
      html: renderVerificationHtml({
        code: input.code,
        expiresInMinutes: input.expiresInMinutes,
        copy,
      }),
      text: renderVerificationText({
        code: input.code,
        expiresInMinutes: input.expiresInMinutes,
        copy,
      }),
    });

    if (result.error) {
      throw new Error('Signup verification email send failed.');
    }

    return {
      delivered: true,
      messageId: result.data?.id,
    };
  } catch (error) {
    await captureException(error, {
      component: 'signup_verification_email',
      hasRecipient: true,
    });

    return { delivered: false, skippedReason: 'send_failed' };
  }
}

function getEmailConfig() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    return null;
  }

  return { apiKey, from };
}

function getVerificationCopy(locale?: string | null) {
  const normalizedLocale = normalizeLocale(locale);

  if (normalizedLocale === 'zh') {
    return {
      subject: '你的 gptimage 注册验证码',
      title: '确认你的邮箱',
      intro: '请输入下面的验证码完成 gptimage 注册。',
      expiry: '验证码有效期',
      minutes: '分钟',
      outro: '如果不是你本人操作，可以忽略这封邮件。',
    };
  }

  if (normalizedLocale === 'pt') {
    return {
      subject: 'Seu código de verificação do gptimage',
      title: 'Confirme seu e-mail',
      intro: 'Use o código abaixo para concluir seu cadastro no gptimage.',
      expiry: 'Este código expira em',
      minutes: 'minutos',
      outro: 'Se você não solicitou este código, ignore este e-mail.',
    };
  }

  return {
    subject: 'Your gptimage verification code',
    title: 'Confirm your email',
    intro: 'Use the code below to finish creating your gptimage account.',
    expiry: 'This code expires in',
    minutes: 'minutes',
    outro: 'If you did not request this code, you can ignore this email.',
  };
}

function normalizeLocale(locale?: string | null): Locale {
  return locale === 'zh' || locale === 'en' || locale === 'pt' ? locale : 'en';
}

function renderVerificationHtml(input: {
  code: string;
  expiresInMinutes: number;
  copy: ReturnType<typeof getVerificationCopy>;
}) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>${escapeHtml(input.copy.title)}</title>
      </head>
      <body style="margin:0;background:#f8fafc;color:#111827;font-family:Arial,Helvetica,sans-serif;">
        <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
          <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:28px;">
            <p style="margin:0 0 10px;color:#6b7280;font-size:13px;">${EMAIL_BRAND}</p>
            <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:#111827;">${escapeHtml(input.copy.title)}</h1>
            <p style="font-size:15px;line-height:1.6;color:#111827;">${escapeHtml(input.copy.intro)}</p>
            <p style="margin:24px 0;text-align:center;font-size:32px;letter-spacing:8px;font-weight:700;color:#111827;">${escapeHtml(input.code)}</p>
            <p style="font-size:14px;line-height:1.6;color:#4b5563;">${escapeHtml(input.copy.expiry)} ${input.expiresInMinutes} ${escapeHtml(input.copy.minutes)}.</p>
            <p style="font-size:13px;line-height:1.6;color:#6b7280;">${escapeHtml(input.copy.outro)}</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

function renderVerificationText(input: {
  code: string;
  expiresInMinutes: number;
  copy: ReturnType<typeof getVerificationCopy>;
}) {
  return [
    input.copy.title,
    '',
    input.copy.intro,
    '',
    input.code,
    '',
    `${input.copy.expiry} ${input.expiresInMinutes} ${input.copy.minutes}.`,
    input.copy.outro,
  ].join('\n');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
