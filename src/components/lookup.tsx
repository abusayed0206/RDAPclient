'use client';

import { Loader2, Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import type { NormalizedAsnData } from '@/lib/asn-rdap';
import type { NormalizedIPData } from '@/lib/ip-rdap';
import { apiPath, DetectedQuery, detectQuery, lookupLabels } from '@/lib/query';
import type { NormalizedRdapData } from '@/lib/rdap';
import type { RdapStage } from '@/lib/rdap-common';
import { cn } from '@/lib/utils';

import { AsnResult } from '@/components/results/asn-result';
import { DomainResult } from '@/components/results/domain-result';
import { IpResult } from '@/components/results/ip-result';

type Result =
  | { type: 'domain'; data: NormalizedRdapData }
  | { type: 'ip'; data: NormalizedIPData }
  | { type: 'asn'; data: NormalizedAsnData };

interface Done {
  status: 'done';
  query: DetectedQuery;
  result: Result;
  /** Server-measured lookup time; null when the API did not report one. */
  ms: number | null;
  /** When the registry was queried (older than now on a cache hit). */
  fetchedAt: Date;
  cached: boolean;
}

type State =
  | { status: 'idle' }
  | { status: 'loading'; query: DetectedQuery }
  | { status: 'error'; query: DetectedQuery; message: string; stage: RdapStage }
  | Done;

const EXAMPLES = ['github.com', '1.1.1.1', 'AS13335'];

const STATS = [
  ['Live', 'from the registry'],
  ['IPv4, IPv6', 'and ASNs'],
  ['Free', 'JSON API'],
  ['0', 'ads'],
];

function hostOf(url?: string) {
  if (!url) return undefined;
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

const relFmt = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

function ago(d: Date) {
  const mins = Math.round((Date.now() - d.getTime()) / 60_000);
  return mins < 60
    ? relFmt.format(-mins, 'minute')
    : relFmt.format(-Math.round(mins / 60), 'hour');
}

/**
 * Timing comes from the server's own measurement. An answer counts as cached
 * when the cache layer says so (Vercel edge HIT/STALE or an Age header) or when
 * the body is older than a few seconds (the browser's HTTP cache).
 */
function timing(
  res: Response,
  body: { fetchedAt?: unknown; queryMs?: unknown },
) {
  const t =
    typeof body.fetchedAt === 'string' ? new Date(body.fetchedAt) : new Date();
  const fetchedAt = Number.isNaN(t.getTime()) ? new Date() : t;
  const edge = res.headers.get('x-vercel-cache');
  const age = Number(res.headers.get('age') ?? 0);
  const cached =
    edge === 'HIT' ||
    edge === 'STALE' ||
    age > 0 ||
    Date.now() - fetchedAt.getTime() > 5_000;
  const ms = typeof body.queryMs === 'number' ? body.queryMs : null;
  return { fetchedAt, cached, ms };
}

export function Lookup({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const q = params.get('q') ?? '';

  const [input, setInput] = useState(q);
  const [syncedQ, setSyncedQ] = useState(q);
  const [settled, setSettled] = useState<{ q: string; state: State } | null>(
    null,
  );
  const [hint, setHint] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the field in sync with back/forward navigation (adjust during render).
  if (q !== syncedQ) {
    setSyncedQ(q);
    setInput(q);
  }

  const detected = detectQuery(input);
  const activeQuery = detectQuery(q);
  const state: State = !activeQuery
    ? { status: 'idle' }
    : settled?.q === q
      ? settled.state
      : { status: 'loading', query: activeQuery };

  // The URL is the source of truth: run the lookup whenever ?q changes.
  useEffect(() => {
    const query = detectQuery(q);
    if (!query) return;
    const controller = new AbortController();

    fetch(apiPath(query), { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setSettled({
            q,
            state: {
              status: 'error',
              query,
              message: body.error || `Request failed (${res.status})`,
              stage: (body.stage as RdapStage) ?? 'registry',
            },
          });
          return;
        }
        setSettled({
          q,
          state: {
            status: 'done',
            query,
            result: { type: query.type, data: body } as Result,
            ...timing(res, body),
          },
        });
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') return;
        setSettled({
          q,
          state: {
            status: 'error',
            query,
            message: 'RDAPclient could not be reached.',
            stage: 'input',
          },
        });
      });

    return () => controller.abort();
  }, [q]);

  const go = (value: string) => {
    setHint(null);
    const next = value.trim();
    if (next === q) return;
    router.push(next ? `${pathname}?q=${encodeURIComponent(next)}` : pathname, {
      scroll: false,
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detected) {
      setHint(
        'That isn’t a domain, IP address or ASN. Try something like example.com, 8.8.8.8 or AS15169.',
      );
      inputRef.current?.focus();
      return;
    }
    go(input);
  };

  const idle = state.status === 'idle';
  const loading = state.status === 'loading';
  const wrap = 'mx-auto w-full max-w-6xl px-5 sm:px-8';

  return (
    <div>
      <section className='border-line bg-grid border-b'>
        <div className={cn(wrap, idle ? 'py-14 sm:py-20' : 'py-6')}>
          {idle ? (
            <>
              <h1 className='font-display text-ink text-5xl leading-[0.95] tracking-tight text-balance sm:text-7xl lg:text-[5.5rem]'>
                Who owns this domain,{' '}
                <em className='text-accent'>IP or network?</em>
              </h1>
              <ul className='mt-8 flex flex-wrap gap-2 font-mono text-xs'>
                {STATS.map(([value, label]) => (
                  <li
                    key={label}
                    className='border-line bg-surface rounded-full border px-3 py-1.5'
                  >
                    <span className='text-ink'>{value}</span>{' '}
                    <span className='text-ink-2'>{label}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <h1 className='sr-only'>RDAP lookup</h1>
          )}

          <form
            onSubmit={onSubmit}
            role='search'
            className={cn(idle && 'mt-10 max-w-3xl')}
          >
            <div className='border-line bg-surface focus-within:border-ink-2 flex flex-col gap-2 rounded-2xl border p-2 shadow-sm transition-colors sm:flex-row sm:items-center'>
              <div className='flex min-w-0 flex-1 items-center gap-3 pl-3'>
                <Search className='text-ink-2 size-5 shrink-0' aria-hidden />
                <label htmlFor='q' className='sr-only'>
                  Domain, IP address or ASN
                </label>
                <input
                  ref={inputRef}
                  id='q'
                  name='q'
                  type='text'
                  inputMode='url'
                  autoComplete='off'
                  autoCapitalize='off'
                  autoCorrect='off'
                  spellCheck={false}
                  autoFocus={!q}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setHint(null);
                  }}
                  placeholder='example.com, 8.8.8.8 or AS15169'
                  aria-describedby='q-hint'
                  className='placeholder:text-ink-2/70 text-ink h-12 w-full min-w-0 bg-transparent text-[1.0625rem] outline-none sm:text-[1.125rem]'
                />
                {detected && (
                  <span className='border-line text-ink-2 shrink-0 rounded-full border px-2.5 py-1 font-mono text-xs'>
                    {lookupLabels[detected.type]}
                  </span>
                )}
              </div>
              <button
                type='submit'
                disabled={loading}
                className='bg-ink text-paper inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 font-medium transition-opacity hover:opacity-90 disabled:opacity-70'
              >
                {loading && (
                  <Loader2 className='size-4 animate-spin' aria-hidden />
                )}
                Look up
              </button>
            </div>
            <div id='q-hint' className='mt-3 min-h-6 text-sm'>
              {hint ? (
                <p className='text-danger'>{hint}</p>
              ) : (
                idle && (
                  <p className='text-ink-2 flex flex-wrap items-center gap-2'>
                    Try
                    {EXAMPLES.map((ex) => (
                      <button
                        key={ex}
                        type='button'
                        onClick={() => go(ex)}
                        className='border-line bg-surface text-ink hover:border-ink-2 rounded-full border px-3 py-1 font-mono text-xs transition-colors'
                      >
                        {ex}
                      </button>
                    ))}
                  </p>
                )
              )}
            </div>
          </form>
        </div>
      </section>

      {idle ? (
        children
      ) : (
        <div
          aria-live='polite'
          aria-busy={loading}
          className={cn(wrap, 'mt-10')}
        >
          {state.status === 'loading' && <Loading query={state.query} />}
          {state.status === 'error' && <ErrorAnswer state={state} />}
          {state.status === 'done' && <Answer state={state} />}
        </div>
      )}
    </div>
  );
}

function Loading({ query }: { query: DetectedQuery }) {
  const bar = 'bg-line animate-pulse rounded motion-reduce:animate-none';
  return (
    <div
      aria-label='Loading'
      className='grid gap-10 lg:grid-cols-[22rem_minmax(0,1fr)]'
    >
      <div className='bg-surface border-line rounded-2xl border p-6'>
        <p className='text-ink-2 text-[1.375rem] leading-snug font-semibold'>
          Checking <span className='break-all'>{query.value}</span>…
        </p>
        <div className={`${bar} mt-6 h-8 w-40`} />
      </div>
      <div className='grid gap-10 md:grid-cols-2'>
        {[0, 1].map((i) => (
          <div key={i} className='space-y-3'>
            <div className={`${bar} h-4 w-24`} />
            <div className={`${bar} h-4 w-full`} />
            <div className={`${bar} h-4 w-5/6`} />
            <div className={`${bar} h-4 w-2/3`} />
          </div>
        ))}
      </div>
    </div>
  );
}

const STAGE_TEXT: Record<
  RdapStage,
  { lead: (q: string) => string; next: string }
> = {
  input: {
    lead: (q) => `${q} can’t be looked up.`,
    next: 'Check the spelling, or paste a full domain like example.com.',
  },
  bootstrap: {
    lead: (q) => `No registry publishes records for ${q}.`,
    next: 'This registry has no RDAP service yet. Its WHOIS server may still answer.',
  },
  registry: {
    lead: (q) => `No record found for ${q}.`,
    next: 'It may be unregistered, or the registry is busy. Try again in a moment.',
  },
};

function ErrorAnswer({
  state,
}: {
  state: Extract<State, { status: 'error' }>;
}) {
  const text = STAGE_TEXT[state.stage];
  return (
    <div
      role='alert'
      className='answer-in bg-danger-tint max-w-3xl rounded-2xl p-6 sm:p-8'
    >
      <p className='text-danger text-[1.5rem] leading-snug font-semibold break-words sm:text-[1.75rem]'>
        {text.lead(state.query.value)}
      </p>
      <p className='mt-3 text-[1rem]'>{state.message}</p>
      <p className='text-ink-2 mt-1 text-[1rem]'>{text.next}</p>
    </div>
  );
}

function Answer({ state }: { state: Done }) {
  const { result } = state;
  const server = hostOf(result.data.rdapServer);
  const source = state.cached
    ? `From cache. ${server} was asked ${ago(state.fetchedAt)}.`
    : state.ms !== null
      ? `Live from ${server} in ${state.ms} ms.`
      : `Live from ${server}.`;
  if (result.type === 'domain') {
    return <DomainResult data={result.data} source={source} />;
  }
  if (result.type === 'ip')
    return <IpResult data={result.data} source={source} />;
  return <AsnResult data={result.data} source={source} />;
}
