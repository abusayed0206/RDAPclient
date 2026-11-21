'use client';

import { Loader2, Play } from 'lucide-react';
import { useId, useState } from 'react';

import { cn } from '@/lib/utils';

import { CopyButton } from '@/components/copy-button';
import { JsonBlock } from '@/components/docs/json-view';

type Outcome =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; code: number; ms: number; body: unknown }
  | { status: 'failed'; message: string };

/** Sends a real request to this deployment's API and shows the response. */
export function TryIt({
  path,
  placeholder,
  initial,
  label,
}: {
  /** Path prefix, e.g. "/api/lookup/". */
  path: string;
  placeholder: string;
  initial: string;
  label: string;
}) {
  const [value, setValue] = useState(initial);
  const [outcome, setOutcome] = useState<Outcome>({ status: 'idle' });
  const id = useId();
  const url = `${path}${encodeURIComponent(value.trim())}`;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setOutcome({ status: 'loading' });
    const started = performance.now();
    try {
      const res = await fetch(url);
      const body = await res.json().catch(() => null);
      setOutcome({
        status: 'done',
        code: res.status,
        ms: Math.round(performance.now() - started),
        body,
      });
    } catch {
      setOutcome({
        status: 'failed',
        message: 'The request could not be sent. Check your connection.',
      });
    }
  };

  return (
    <div className='border-line bg-surface rounded-xl border p-4'>
      <form onSubmit={send}>
        <label htmlFor={id} className='text-[0.9375rem] font-medium'>
          {label}
        </label>
        <div className='mt-2 flex flex-col gap-2 sm:flex-row'>
          <div className='border-line-strong focus-within:border-accent bg-paper flex min-w-0 flex-1 items-center rounded-lg border font-mono text-[0.875rem]'>
            <span className='text-ink-2 pl-3 whitespace-nowrap'>
              GET {path}
            </span>
            <input
              id={id}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              spellCheck={false}
              autoCapitalize='off'
              autoComplete='off'
              className='h-10 w-full min-w-0 bg-transparent pr-3 outline-none'
            />
          </div>
          <button
            type='submit'
            disabled={outcome.status === 'loading'}
            className='bg-ink text-paper inline-flex h-10 items-center justify-center gap-2 rounded-full px-5 text-[0.9375rem] font-medium transition-opacity hover:opacity-90 disabled:opacity-70'
          >
            {outcome.status === 'loading' ? (
              <Loader2 className='size-4 animate-spin' aria-hidden />
            ) : (
              <Play className='size-3.5' aria-hidden />
            )}
            Send request
          </button>
        </div>
      </form>

      <div aria-live='polite'>
        {outcome.status === 'failed' && (
          <p className='text-danger mt-4 text-[0.9375rem]'>{outcome.message}</p>
        )}
        {outcome.status === 'done' && (
          <div className='mt-4'>
            <div className='mb-2 flex items-center justify-between gap-3'>
              <p className='text-[0.875rem]'>
                <span
                  className={cn(
                    'rounded-md px-2 py-0.5 font-mono font-medium',
                    outcome.code < 400
                      ? 'bg-ok-tint text-ok'
                      : 'bg-danger-tint text-danger',
                  )}
                >
                  {outcome.code}
                </span>
                <span className='text-ink-2 ml-2'>
                  {outcome.ms} ms round trip
                </span>
              </p>
              <CopyButton
                text={JSON.stringify(outcome.body, null, 2)}
                className='h-8'
              />
            </div>
            <JsonBlock
              value={outcome.body}
              className='max-h-96'
              label='Response body'
            />
          </div>
        )}
      </div>
    </div>
  );
}
