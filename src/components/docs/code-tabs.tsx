'use client';

import { useId, useState } from 'react';

import { cn } from '@/lib/utils';

import { CopyButton } from '@/components/copy-button';
import { CodeBlock } from '@/components/docs/json-view';

export interface CodeSample {
  label: string;
  code: string;
}

export function CodeTabs({ samples }: { samples: CodeSample[] }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const current = samples[active];

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next =
      (active + (e.key === 'ArrowRight' ? 1 : -1) + samples.length) %
      samples.length;
    setActive(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };

  return (
    <div className='border-line overflow-hidden rounded-xl border'>
      <div className='border-line bg-surface flex items-center justify-between gap-2 border-b px-2 py-1.5'>
        <div role='tablist' aria-label='Example language' onKeyDown={onKey}>
          {samples.map((s, i) => (
            <button
              key={s.label}
              id={`${id}-tab-${i}`}
              role='tab'
              type='button'
              aria-selected={i === active}
              aria-controls={`${id}-panel`}
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              className={cn(
                'rounded-md px-3 py-1.5 text-[0.875rem] font-medium transition-colors',
                i === active ? 'bg-sunk text-ink' : 'text-ink-2 hover:text-ink',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <CopyButton text={current.code} className='h-8 border-transparent' />
      </div>
      <div
        id={`${id}-panel`}
        role='tabpanel'
        aria-labelledby={`${id}-tab-${active}`}
      >
        <CodeBlock className='rounded-none'>{current.code}</CodeBlock>
      </div>
    </div>
  );
}
