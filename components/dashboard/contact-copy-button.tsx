'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';

type ContactCopyButtonProps = {
  value: string;
  label: string;
  copiedLabel: string;
  disabledLabel: string;
};

async function copyToClipboard(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

export function ContactCopyButton({
  value,
  label,
  copiedLabel,
  disabledLabel,
}: ContactCopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value) return;
    await copyToClipboard(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full justify-center border-gray-200 bg-white text-gray-800 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 sm:w-auto"
      disabled={!value}
      onClick={handleCopy}
    >
      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
      {value ? (copied ? copiedLabel : label) : disabledLabel}
    </Button>
  );
}
