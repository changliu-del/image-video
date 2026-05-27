import 'server-only';

import { Resend } from 'resend';

import { captureException } from '@/lib/observability/sentry';

export interface GenerationNotificationJob {
  id: string;
  userId: number;
  productName: string;
  headline?: string | null;
  aspectRatio: string;
  durationSeconds: number;
  templateSlug: string;
}

interface GenerationSucceededNotificationInput {
  to?: string | null;
  job: GenerationNotificationJob;
  finalVideoUrl: string;
}

interface GenerationFailedNotificationInput {
  to?: string | null;
  job: GenerationNotificationJob;
  errorSummary: string;
}

interface EmailNotificationResult {
  delivered: boolean;
  messageId?: string;
  skippedReason?: 'missing_config' | 'missing_recipient' | 'send_failed';
}

interface EmailMessage {
  type: 'generation_succeeded' | 'generation_failed';
  to?: string | null;
  subject: string;
  html: string;
  text: string;
  job: GenerationNotificationJob;
}

const EMAIL_BRAND = 'Ecommerce Video Maker';
const SENSITIVE_ENV_NAMES = [
  'FAL_KEY',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'RESEND_API_KEY',
  'POSTGRES_URL',
  'AUTH_SECRET'
] as const;

export async function sendGenerationSucceededNotification(
  input: GenerationSucceededNotificationInput
): Promise<EmailNotificationResult> {
  return await sendEmail({
    type: 'generation_succeeded',
    to: input.to,
    subject: cleanSubject(`Your video is ready: ${input.job.productName}`),
    html: renderSucceededHtml(input),
    text: renderSucceededText(input),
    job: input.job
  });
}

export async function sendGenerationFailedNotification(
  input: GenerationFailedNotificationInput
): Promise<EmailNotificationResult> {
  const safeErrorSummary = sanitizeErrorSummary(input.errorSummary);

  return await sendEmail({
    type: 'generation_failed',
    to: input.to,
    subject: cleanSubject(`Video generation failed: ${input.job.productName}`),
    html: renderFailedHtml({ ...input, errorSummary: safeErrorSummary }),
    text: renderFailedText({ ...input, errorSummary: safeErrorSummary }),
    job: input.job
  });
}

async function sendEmail(
  message: EmailMessage
): Promise<EmailNotificationResult> {
  const config = getEmailConfig();
  if (!config) {
    return { delivered: false, skippedReason: 'missing_config' };
  }

  const to = normalizeRecipient(message.to);
  if (!to) {
    return { delivered: false, skippedReason: 'missing_recipient' };
  }

  try {
    const resend = new Resend(config.apiKey);
    const result = await resend.emails.send({
      from: config.from,
      to,
      subject: message.subject,
      html: message.html,
      text: message.text
    });

    if (result.error) {
      throw new Error(
        `Resend send failed: ${sanitizeErrorSummary(result.error)}`
      );
    }

    return {
      delivered: true,
      messageId: result.data?.id
    };
  } catch (error) {
    await captureException(error, {
      component: 'email_notifications',
      notificationType: message.type,
      jobId: message.job.id,
      userId: message.job.userId,
      hasRecipient: true
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

function renderSucceededHtml(input: GenerationSucceededNotificationInput) {
  const job = input.job;
  const productName = escapeHtml(job.productName);
  const headline = job.headline ? escapeHtml(job.headline) : null;
  const finalVideoUrl = escapeHtml(input.finalVideoUrl);

  return renderEmailLayout({
    title: 'Your video is ready',
    preview: `${job.productName} video generation completed.`,
    body: `
      <p>Your ecommerce video for <strong>${productName}</strong> has finished generating.</p>
      ${headline ? `<p>Headline: ${headline}</p>` : ''}
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;width:100%;border-collapse:collapse;">
        ${renderDetailRow('Job ID', job.id)}
        ${renderDetailRow('Product', job.productName)}
        ${renderDetailRow('Template', job.templateSlug)}
        ${renderDetailRow('Format', `${job.aspectRatio}, ${job.durationSeconds}s`)}
      </table>
      <p><a href="${finalVideoUrl}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:600;">View final video</a></p>
      <p style="word-break:break-all;color:#4b5563;font-size:13px;">${finalVideoUrl}</p>
    `
  });
}

function renderSucceededText(input: GenerationSucceededNotificationInput) {
  const job = input.job;

  return [
    'Your video is ready.',
    '',
    `Job ID: ${job.id}`,
    `Product: ${job.productName}`,
    job.headline ? `Headline: ${job.headline}` : null,
    `Template: ${job.templateSlug}`,
    `Format: ${job.aspectRatio}, ${job.durationSeconds}s`,
    `Final video: ${input.finalVideoUrl}`
  ]
    .filter(Boolean)
    .join('\n');
}

function renderFailedHtml(input: GenerationFailedNotificationInput) {
  const job = input.job;
  const productName = escapeHtml(job.productName);
  const headline = job.headline ? escapeHtml(job.headline) : null;
  const errorSummary = escapeHtml(input.errorSummary);

  return renderEmailLayout({
    title: 'Video generation failed',
    preview: `${job.productName} video generation failed.`,
    body: `
      <p>We could not finish generating the ecommerce video for <strong>${productName}</strong>.</p>
      ${headline ? `<p>Headline: ${headline}</p>` : ''}
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;width:100%;border-collapse:collapse;">
        ${renderDetailRow('Job ID', job.id)}
        ${renderDetailRow('Product', job.productName)}
        ${renderDetailRow('Template', job.templateSlug)}
        ${renderDetailRow('Format', `${job.aspectRatio}, ${job.durationSeconds}s`)}
      </table>
      <p style="margin-bottom:8px;font-weight:600;">Error summary</p>
      <p style="margin-top:0;color:#4b5563;">${errorSummary}</p>
    `
  });
}

function renderFailedText(input: GenerationFailedNotificationInput) {
  const job = input.job;

  return [
    'Video generation failed.',
    '',
    `Job ID: ${job.id}`,
    `Product: ${job.productName}`,
    job.headline ? `Headline: ${job.headline}` : null,
    `Template: ${job.templateSlug}`,
    `Format: ${job.aspectRatio}, ${job.durationSeconds}s`,
    `Error summary: ${input.errorSummary}`
  ]
    .filter(Boolean)
    .join('\n');
}

function renderEmailLayout(input: {
  title: string;
  preview: string;
  body: string;
}) {
  return `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
        <title>${escapeHtml(input.title)}</title>
      </head>
      <body style="margin:0;background:#f8fafc;color:#111827;font-family:Arial,Helvetica,sans-serif;">
        <span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;">${escapeHtml(input.preview)}</span>
        <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
          <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:28px;">
            <p style="margin:0 0 10px;color:#6b7280;font-size:13px;">${EMAIL_BRAND}</p>
            <h1 style="margin:0 0 18px;font-size:24px;line-height:1.3;color:#111827;">${escapeHtml(input.title)}</h1>
            <div style="font-size:15px;line-height:1.6;color:#111827;">
              ${input.body}
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
}

function renderDetailRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding:8px 0;color:#6b7280;border-bottom:1px solid #e5e7eb;width:120px;">${escapeHtml(label)}</td>
      <td style="padding:8px 0;color:#111827;border-bottom:1px solid #e5e7eb;">${escapeHtml(value)}</td>
    </tr>
  `;
}

function normalizeRecipient(value?: string | null) {
  const recipient = value?.trim();
  return recipient ? recipient : null;
}

function cleanSubject(value: string) {
  return value.replace(/[\r\n]+/g, ' ').slice(0, 140);
}

function sanitizeErrorSummary(value: unknown) {
  const raw = toErrorMessage(value);
  let sanitized = raw;

  for (const envName of SENSITIVE_ENV_NAMES) {
    sanitized = sanitized.replace(
      new RegExp(escapeRegExp(envName), 'gi'),
      '[redacted]'
    );
    const envValue = process.env[envName];
    if (envValue) {
      sanitized = sanitized.replace(
        new RegExp(escapeRegExp(envValue), 'g'),
        '[redacted]'
      );
    }
  }

  sanitized = sanitized
    .replace(/\bwhsec_[A-Za-z0-9_]+\b/g, '[redacted]')
    .replace(/\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9_]+\b/g, '[redacted]')
    .replace(/\b[A-Za-z0-9+/=_-]{48,}\b/g, '[redacted]')
    .replace(
      /((?:secret|token|signature|credential|password|key)=)[^\s&]+/gi,
      '$1[redacted]'
    );

  return sanitized.slice(0, 600) || 'Unknown generation error';
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
