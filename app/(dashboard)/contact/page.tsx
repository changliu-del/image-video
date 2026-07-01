import { Mail, MessageCircle, QrCode } from 'lucide-react';

import { ContactCopyButton } from '@/components/dashboard/contact-copy-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  normalizeDashboardLocale,
  type DashboardLocale,
} from '@/lib/dashboard/content';

type ContactPageProps = {
  searchParams?: Promise<{
    locale?: string | string[];
  }>;
};

type ContactCopy = {
  eyebrow: string;
  title: string;
  description: string;
  wechatTitle: string;
  wechatDescription: string;
  wechatIdLabel: string;
  missingWechatId: string;
  copyWechat: string;
  copiedWechat: string;
  copyUnavailable: string;
  qrTitle: string;
  qrAlt: string;
  missingQr: string;
  emailTitle: string;
  emailDescription: string;
  emailAction: string;
  noteBody: string;
};

const contactCopy = {
  pt: {
    eyebrow: 'Suporte',
    title: 'Fale com a equipe Vendeo',
    description:
      'Use o WeChat para falar com suporte sobre conta, créditos, pagamentos ou resultados de geração.',
    wechatTitle: 'WeChat',
    wechatDescription:
      'Escaneie o QR code no WeChat ou pesquise pelo ID de suporte.',
    wechatIdLabel: 'ID do WeChat',
    missingWechatId: 'ID de WeChat pendente',
    copyWechat: 'Copiar ID',
    copiedWechat: 'Copiado',
    copyUnavailable: 'ID pendente',
    qrTitle: 'QR code',
    qrAlt: 'QR code do WeChat do suporte Vendeo',
    missingQr: 'QR code será adicionado em breve.',
    emailTitle: 'Email',
    emailDescription:
      'Envie o email da sua conta e uma breve descrição do problema.',
    emailAction: 'Enviar email',
    noteBody:
      'Para problemas de geração, envie o email da conta, o tipo de criação e o horário aproximado.',
  },
  en: {
    eyebrow: 'Support',
    title: 'Contact the Vendeo team',
    description:
      'Use WeChat for support with accounts, credits, payments, or generation results.',
    wechatTitle: 'WeChat',
    wechatDescription:
      'Scan the QR code in WeChat or search for the support ID.',
    wechatIdLabel: 'WeChat ID',
    missingWechatId: 'WeChat ID pending',
    copyWechat: 'Copy ID',
    copiedWechat: 'Copied',
    copyUnavailable: 'ID pending',
    qrTitle: 'QR code',
    qrAlt: 'Vendeo support WeChat QR code',
    missingQr: 'QR code will be added soon.',
    emailTitle: 'Email',
    emailDescription:
      'Send the email tied to your account and a short description of the issue.',
    emailAction: 'Send email',
    noteBody:
      'For generation issues, include the account email, creation type, and approximate time.',
  },
} satisfies Record<'pt' | 'en', ContactCopy>;

function firstParam(value: string | string[] | null | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getContactCopy(locale: DashboardLocale) {
  return locale === 'pt' ? contactCopy.pt : contactCopy.en;
}

function getSupportContact() {
  return {
    wechatId: process.env.NEXT_PUBLIC_SUPPORT_WECHAT_ID?.trim() ?? '',
    wechatQrSrc: process.env.NEXT_PUBLIC_SUPPORT_WECHAT_QR_SRC?.trim() ?? '',
    email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || 'support@8ilx.com',
  };
}

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const params = await searchParams;
  const locale = normalizeDashboardLocale(firstParam(params?.locale));
  const copy = getContactCopy(locale);
  const support = getSupportContact();

  return (
    <main className="flex-1 p-4 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-indigo-600">{copy.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-semibold text-gray-950 lg:text-3xl">
            {copy.title}
          </h1>
          <p className="mt-3 text-sm leading-6 text-gray-500 lg:text-base">
            {copy.description}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="rounded-lg border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-gray-950">
                <MessageCircle className="size-5 text-indigo-600" />
                {copy.wechatTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-6 text-gray-500">
                {copy.wechatDescription}
              </p>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase text-gray-400">
                  {copy.wechatIdLabel}
                </p>
                <p className="mt-2 break-all text-lg font-semibold text-gray-950">
                  {support.wechatId || copy.missingWechatId}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <ContactCopyButton
                  value={support.wechatId}
                  label={copy.copyWechat}
                  copiedLabel={copy.copiedWechat}
                  disabledLabel={copy.copyUnavailable}
                />
                <p className="text-sm leading-6 text-gray-500">{copy.noteBody}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-lg border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-gray-950">
                <QrCode className="size-5 text-indigo-600" />
                {copy.qrTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-200 bg-gray-50">
                {support.wechatQrSrc ? (
                  <img
                    src={support.wechatQrSrc}
                    alt={copy.qrAlt}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center text-gray-400">
                    <QrCode className="size-12" />
                    <p className="text-sm leading-6">{copy.missingQr}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="rounded-lg border-gray-200 bg-white shadow-sm">
          <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-950">
                <Mail className="size-4 text-indigo-600" />
                {copy.emailTitle}
              </div>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                {copy.emailDescription}
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-gray-200 bg-white text-gray-800 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <a href={`mailto:${support.email}`}>{copy.emailAction}</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
