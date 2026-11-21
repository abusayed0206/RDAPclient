import { ExternalLink as ExternalIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/** A titled group of facts. Open layout: separated by space, not boxes. */
export function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('min-w-0', className)}>
      <h3 className='font-display text-ink mb-3 text-2xl'>{title}</h3>
      {children}
    </section>
  );
}

type FieldValue = React.ReactNode | undefined | null;

/** Label / value rows; empty and "N/A" values are dropped. */
export function Fields({
  items,
}: {
  items: [label: string, value: FieldValue, opts?: { mono?: boolean }][];
}) {
  const visible = items.filter(
    ([, v]) => v !== undefined && v !== null && v !== '' && v !== 'N/A',
  );
  if (!visible.length) {
    return (
      <p className='text-ink-2 text-[0.9375rem]'>
        The registry didn’t publish this.
      </p>
    );
  }
  return (
    <dl className='divide-line divide-y text-[0.9375rem]'>
      {visible.map(([label, value, opts]) => (
        <div
          key={label}
          className='flex flex-wrap items-baseline justify-between gap-x-6 gap-y-0.5 py-2.5 first:pt-0 last:pb-0'
        >
          <dt className='text-ink-2'>{label}</dt>
          <dd
            className={cn(
              'min-w-0 text-right break-words',
              opts?.mono && 'font-mono text-[0.875rem]',
            )}
          >
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export type Tone = 'neutral' | 'ok' | 'warn' | 'danger' | 'accent';

const toneClass: Record<Tone, string> = {
  neutral: 'bg-sunk text-ink',
  ok: 'bg-ok-tint text-ok',
  warn: 'bg-warn-tint text-warn',
  danger: 'bg-danger-tint text-danger',
  accent: 'bg-accent-tint text-accent-strong',
};

export function Pill({
  tone = 'neutral',
  children,
}: {
  tone?: Tone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-xs whitespace-nowrap',
        toneClass[tone],
      )}
    >
      {children}
    </span>
  );
}

export function ExternalLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      className={cn(
        'text-accent-strong decoration-accent/40 hover:decoration-accent inline-flex items-baseline gap-1 break-all underline decoration-1 transition-colors',
        className,
      )}
    >
      {children}
      <ExternalIcon className='size-3 shrink-0 self-center' aria-hidden />
    </a>
  );
}

export function MailLink({ email }: { email?: string }) {
  if (!email) return null;
  return (
    <a
      href={`mailto:${email}`}
      className='text-accent-strong decoration-accent/40 hover:decoration-accent break-all underline decoration-1'
    >
      {email}
    </a>
  );
}

export const secondaryButton =
  'border-line bg-surface text-ink hover:border-ink-2 inline-flex h-9 items-center gap-2 rounded-full border px-4 text-sm transition-colors';
