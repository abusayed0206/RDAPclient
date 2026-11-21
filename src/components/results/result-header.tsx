'use client';

import { FileJson } from 'lucide-react';

import { CopyButton } from '@/components/copy-button';
import { secondaryButton } from '@/components/ui';

/**
 * The summary panel: the plain-English answer, its state, where it came from,
 * and the developer actions. Sticks beside the details on wide screens.
 */
export function ResultHeader({
  sentence,
  pills,
  data,
  rdapUrl,
  source,
}: {
  sentence: React.ReactNode;
  pills?: React.ReactNode;
  data: unknown;
  rdapUrl?: string;
  source: string;
}) {
  return (
    <aside className='answer-in bg-surface border-line rounded-2xl border p-6 lg:sticky lg:top-20'>
      <p className='font-display text-ink text-3xl leading-tight text-balance sm:text-4xl'>
        {sentence}
      </p>
      {pills && <div className='mt-5 flex flex-wrap gap-2'>{pills}</div>}
      <div className='border-line mt-6 flex flex-wrap gap-2 border-t pt-5'>
        <CopyButton
          text={() => JSON.stringify(data, null, 2)}
          label='Copy JSON'
        />
        {rdapUrl && (
          <a
            href={rdapUrl}
            target='_blank'
            rel='noopener noreferrer'
            className={secondaryButton}
          >
            <FileJson className='size-3.5' aria-hidden />
            Raw RDAP
          </a>
        )}
      </div>
      <p className='text-ink-2 mt-4 text-[0.8125rem] break-words'>{source}</p>
    </aside>
  );
}
