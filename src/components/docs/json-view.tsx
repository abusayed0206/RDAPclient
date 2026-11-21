import { cn } from '@/lib/utils';

const TOKEN =
  /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g;

/** Minimal JSON syntax colouring: keys, strings, numbers, literals. */
export function highlightJson(json: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of json.matchAll(TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) out.push(json.slice(last, at));
    const [whole, str, colon, literal, num] = m;
    let cls = '';
    if (str && colon) cls = 'text-ink';
    else if (str) cls = 'text-accent-strong';
    else if (literal) cls = 'text-warn';
    else if (num) cls = 'text-ink';
    if (str && colon) {
      out.push(
        <span key={i++} className={cls}>
          {str}
        </span>,
        colon,
      );
    } else {
      out.push(
        <span key={i++} className={cls}>
          {whole}
        </span>,
      );
    }
    last = at + whole.length;
  }
  if (last < json.length) out.push(json.slice(last));
  return out;
}

export function CodeBlock({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <pre
      aria-label={label}
      tabIndex={0}
      className={cn(
        'bg-sunk text-ink-2 overflow-x-auto rounded-xl p-4 font-mono text-[0.8125rem] leading-relaxed',
        className,
      )}
    >
      <code>{children}</code>
    </pre>
  );
}

export function JsonBlock({
  value,
  className,
  label,
}: {
  value: unknown;
  className?: string;
  label?: string;
}) {
  const text =
    typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return (
    <CodeBlock className={className} label={label}>
      {highlightJson(text)}
    </CodeBlock>
  );
}
