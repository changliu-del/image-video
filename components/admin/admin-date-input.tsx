'use client';

import type { ComponentProps } from 'react';
import { CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type AdminDateInputProps = Omit<
  ComponentProps<'input'>,
  'type' | 'inputMode' | 'pattern' | 'placeholder'
> & {
  placeholder?: string;
  wrapperClassName?: string;
};

export function AdminDateInput({
  className,
  wrapperClassName,
  placeholder = 'YYYY-MM-DD',
  ...props
}: AdminDateInputProps) {
  return (
    <div className={cn('relative', wrapperClassName)}>
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className={cn('pr-9 font-mono tabular-nums', className)}
      />
      <CalendarDays
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-gray-500"
      />
    </div>
  );
}
