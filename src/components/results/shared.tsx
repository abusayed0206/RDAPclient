import { Lock } from 'lucide-react';

import type { EntityDetails, RdapRemark } from '@/lib/rdap-common';

import { MailLink, Pill, Section, Tone } from '@/components/ui';

const dateFmt = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const relFmt = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const regionNames =
  typeof Intl.DisplayNames === 'function'
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

/** Close a sentence without doubling a period ("Cloudflare, Inc." + "."). */
export function finish(text: string): string {
  return `${text.replace(/\.+$/, '')}.`;
}

export function countryName(code?: string): string | undefined {
  if (!code) return undefined;
  try {
    return regionNames?.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

export function parseDate(value?: string): Date | null {
  if (!value || value === 'N/A') return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(value?: string): string | undefined {
  const d = parseDate(value);
  return d ? dateFmt.format(d) : undefined;
}

export function daysFromNow(value?: string): number | null {
  const d = parseDate(value);
  return d ? Math.round((d.getTime() - Date.now()) / 86_400_000) : null;
}

export function relative(days: number): string {
  const abs = Math.abs(days);
  if (abs < 45) return relFmt.format(days, 'day');
  if (abs < 730) return relFmt.format(Math.round(days / 30), 'month');
  return relFmt.format(Math.round(days / 365), 'year');
}

/** "9 Oct 2007" with the distance underneath. Undefined (row hidden) when unusable. */
export function dateField(value?: string) {
  const d = parseDate(value);
  if (!d) return undefined;
  const days = daysFromNow(value)!;
  return (
    <time
      dateTime={d.toISOString()}
      title={d.toUTCString()}
      className='inline-flex flex-col items-end'
    >
      <span>{dateFmt.format(d)}</span>
      <span className='text-ink-2 text-[0.8125rem]'>{relative(days)}</span>
    </time>
  );
}

const DANGER = /(pending ?delete|redemption|hold|inactive|revoked|removed)/i;
const OK = /^(active|ok|allocated|assigned)/i;

function statusTone(label: string): Tone {
  if (DANGER.test(label)) return 'danger';
  if (OK.test(label)) return 'ok';
  return 'neutral';
}

export function StatusList({
  statuses,
}: {
  statuses: { label: string; url?: string }[];
}) {
  if (!statuses.length) {
    return (
      <p className='text-ink-2 text-[0.9375rem]'>No status codes reported.</p>
    );
  }
  return (
    <ul className='flex flex-wrap gap-2'>
      {statuses.map(({ label, url }) => {
        const pill = (
          <Pill tone={statusTone(label)}>
            {/prohibited/i.test(label) && (
              <Lock className='size-3' aria-hidden />
            )}
            {label}
          </Pill>
        );
        return (
          <li key={label}>
            {url ? (
              <a
                href={url}
                target='_blank'
                rel='noopener noreferrer'
                title={`What “${label}” means (ICANN)`}
                className='hover:opacity-80'
              >
                {pill}
              </a>
            ) : (
              pill
            )}
          </li>
        );
      })}
    </ul>
  );
}

const roleLabel = (r: string) => r.charAt(0).toUpperCase() + r.slice(1);

export function ContactsSection({ entities }: { entities?: EntityDetails[] }) {
  const rows = (entities ?? []).filter(
    (e) => e.name || e.organization || e.email || e.handle,
  );
  if (!rows.length) return null;
  return (
    <Section title='Contacts'>
      <ul className='divide-line border-line divide-y border-y text-[0.9375rem]'>
        {rows.map((e, i) => (
          <li
            key={`${e.handle ?? ''}-${i}`}
            className='grid gap-x-6 gap-y-1 py-3 md:grid-cols-[10rem_minmax(0,1.3fr)_minmax(0,1fr)]'
          >
            <span className='text-ink-2'>
              {(e.roles ?? ['contact']).map(roleLabel).join(', ')}
            </span>
            <span className='min-w-0 break-words'>
              <span className='font-medium'>
                {e.organization ?? e.name ?? e.handle}
              </span>
              {e.organization && e.name && e.name !== e.organization && (
                <span className='text-ink-2 block'>{e.name}</span>
              )}
              {e.handle && (e.organization || e.name) && (
                <span className='text-ink-2 block font-mono text-[0.8125rem]'>
                  {e.handle}
                </span>
              )}
            </span>
            <span className='min-w-0 md:text-right'>
              <MailLink email={e.email} />
              {e.phone && <span className='text-ink-2 block'>{e.phone}</span>}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function NoticesSection({ remarks }: { remarks?: RdapRemark[] }) {
  const items = (remarks ?? []).filter((r) => r.description?.length);
  if (!items.length) return null;
  return (
    <Section title='Registry notices'>
      <div className='divide-line border-line divide-y border-y text-[0.9375rem]'>
        {items.map((r, i) => (
          <details key={i} className='group py-2.5'>
            <summary className='hover:text-accent-strong cursor-pointer font-medium select-none'>
              {r.title ?? `Notice ${i + 1}`}
            </summary>
            <div className='text-ink-2 max-w-[68ch] space-y-1.5 pt-2 pb-1'>
              {r.description?.map((line, j) => (
                <p key={j} className='break-words'>
                  {line}
                </p>
              ))}
            </div>
          </details>
        ))}
      </div>
    </Section>
  );
}

/** Three columns of facts on wide screens, stacked on phones. */
export function FactGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className='grid gap-x-10 gap-y-10 md:grid-cols-2'>{children}</div>
  );
}
