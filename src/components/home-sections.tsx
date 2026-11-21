import Link from 'next/link';

import { CodeBlock, JsonBlock } from '@/components/docs/json-view';

const wrap = 'mx-auto w-full max-w-6xl px-4 sm:px-6';
const section = 'pt-24';
const label = 'text-ink-2 font-mono text-xs tracking-wider uppercase';
const h2 = 'font-display text-ink mt-2 text-4xl text-balance sm:text-5xl';
const primary =
  'bg-ink text-paper inline-flex rounded-full px-5 py-2.5 font-medium transition-opacity hover:opacity-90';

const LANES = [
  { y: 50, registry: 'Verisign', query: 'github.com' },
  { y: 160, registry: 'ARIN', query: '8.8.8.8' },
  { y: 270, registry: 'RIPE NCC', query: 'AS3333' },
];

/** One input, a hub, three registries; pulses travel the real route. */
function RouteDiagram() {
  return (
    <svg
      viewBox='0 0 960 320'
      role='img'
      aria-label='A query goes to the IANA bootstrap registry, which points it to Verisign, ARIN or RIPE NCC.'
      className='w-full'
    >
      <defs>
        {LANES.map((l) => (
          <path
            key={l.registry}
            id={`lane-${l.y}`}
            d={`M240 160 H380 M600 160 C660 160 670 ${l.y} 730 ${l.y}`}
          />
        ))}
      </defs>
      {LANES.map((l) => (
        <path
          key={l.registry}
          d={`M600 160 C660 160 670 ${l.y} 730 ${l.y}`}
          fill='none'
          stroke='var(--line-strong)'
          strokeWidth='2'
        />
      ))}
      <path d='M240 160 H380' stroke='var(--line-strong)' strokeWidth='2' />

      {LANES.map((l, i) => (
        <circle key={l.registry} className='pulse' r='5' fill='var(--accent)'>
          <animateMotion
            dur='3s'
            begin={`${i}s`}
            repeatCount='indefinite'
            path={`M240 160 H600 C660 160 670 ${l.y} 730 ${l.y}`}
          />
        </circle>
      ))}

      <g fontFamily='var(--font-geist-mono)' fontSize='15'>
        <rect
          x='20'
          y='130'
          width='220'
          height='60'
          rx='6'
          fill='var(--paper)'
          stroke='var(--ink)'
          strokeWidth='1.5'
        />
        <text x='130' y='166' textAnchor='middle' fill='var(--ink)'>
          your query
        </text>

        <rect
          x='380'
          y='120'
          width='220'
          height='80'
          rx='6'
          fill='var(--ink)'
        />
        <text
          x='490'
          y='156'
          textAnchor='middle'
          fill='var(--paper)'
          fontSize='16'
        >
          IANA bootstrap
        </text>
        <text
          x='490'
          y='180'
          textAnchor='middle'
          fill='var(--line-strong)'
          fontSize='13'
        >
          which registry?
        </text>

        {LANES.map((l) => (
          <g key={l.registry}>
            <rect
              x='730'
              y={l.y - 30}
              width='210'
              height='60'
              rx='6'
              fill='var(--surface)'
              stroke='var(--line-strong)'
            />
            <text x='750' y={l.y - 4} fill='var(--ink)' fontSize='15'>
              {l.registry}
            </text>
            <text x='750' y={l.y + 17} fill='var(--ink-2)' fontSize='13'>
              {l.query}
            </text>
          </g>
        ))}
      </g>
    </svg>
  );
}

const STEPS = [
  {
    title: 'You paste anything',
    body: 'A domain, a URL, an IPv4 or IPv6 address, or an AS number. The type is detected as you type.',
  },
  {
    title: 'IANA names the registry',
    body: 'Its bootstrap files list which server is responsible for each TLD, address block and AS range.',
  },
  {
    title: 'The registry answers',
    body: 'The record comes back live from that server, tidied into dates, owners, nameservers and contacts.',
  },
];

const CURL = 'curl https://rdap.sayed.app/api/lookup/github.com';

const SAMPLE = {
  domainName: 'github.com',
  registrar: 'MarkMonitor Inc.',
  expiresOn: 'Mon, 09 Oct 2028 18:20:50 GMT',
  dnssec: 'Unsigned',
  nameservers: ['dns1.p08.nsone.net', 'ns-1283.awsdns-32.org'],
  rdapServer: 'https://rdap.verisign.com/com/v1/',
  queryMs: 412,
};

export function HomeSections() {
  return (
    <>
      <section id='how' className={section}>
        <div className={wrap}>
          <p className={label}>How it works</p>
          <h2 className={`${h2} max-w-2xl`}>
            How a lookup finds the right registry
          </h2>
          <div className='border-line bg-surface mt-8 rounded-2xl border p-6 max-md:hidden'>
            <RouteDiagram />
          </div>
          <ol className='mt-12 grid gap-8 md:grid-cols-3'>
            {STEPS.map((s) => (
              <li key={s.title} className='border-line border-t pt-5'>
                <h3 className='font-display text-ink text-2xl'>{s.title}</h3>
                <p className='text-ink-2 mt-2 text-[0.9375rem] leading-relaxed'>
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id='api-intro' className={section}>
        <div className={`${wrap} grid items-center gap-12 lg:grid-cols-2`}>
          <div>
            <p className={label}>For developers</p>
            <h2 className={h2}>A free JSON API for your scripts</h2>
            <p className='text-ink-2 mt-5 max-w-[48ch] text-[1.0625rem] leading-relaxed'>
              The same answers over HTTPS. No key and no sign-up, CORS is on,
              and every response says which registry answered and how fast.
            </p>
            <div className='mt-8'>
              <Link href='/api' className={primary}>
                Read the API docs
              </Link>
            </div>
          </div>
          <div className='min-w-0 space-y-3'>
            <CodeBlock className='bg-ink text-paper rounded-2xl'>
              {CURL}
            </CodeBlock>
            <JsonBlock
              value={SAMPLE}
              className='bg-surface border-line rounded-2xl border'
            />
          </div>
        </div>
      </section>
    </>
  );
}
