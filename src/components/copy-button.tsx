'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import { secondaryButton } from '@/components/ui';

export function CopyButton({
  text,
  label = 'Copy',
  className,
}: {
  text: string | (() => string);
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        typeof text === 'function' ? text() : text,
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked (insecure context or permissions); nothing to do.
    }
  };

  return (
    <button
      type='button'
      onClick={copy}
      className={cn(secondaryButton, className)}
      aria-live='polite'
    >
      {copied ? (
        <Check className='text-ok size-3.5' aria-hidden />
      ) : (
        <Copy className='size-3.5' aria-hidden />
      )}
      {copied ? 'Copied' : label}
    </button>
  );
}
