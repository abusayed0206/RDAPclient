import type { Metadata } from 'next';

import { CopyButton } from '@/components/copy-button';
import { CodeTabs } from '@/components/docs/code-tabs';
import { CodeBlock, JsonBlock } from '@/components/docs/json-view';
import { TryIt } from '@/components/docs/try-it';
import { SiteFooter, SiteHeader } from '@/components/site-chrome';

import { siteConfig } from '@/constant/config';

export const metadata: Metadata = {
  title: 'API',
  description:
    'Free JSON API for domain, IP address and ASN registration data. No key, CORS enabled, with live examples.',
};

const BASE = siteConfig.url;

function samples(path: string) {
  const url = `${BASE}${path}`;
  return [
    { label: 'curl', code: `curl ${url}` },
    {
      label: 'JavaScript',
      code: `const res = await fetch('${url}');
const data = await res.json();

if (!res.ok) throw new Error(data.error);
console.log(data);`,
    },
    {
      label: 'Python',
      code: `import requests

res = requests.get('${url}', timeout=15)
data = res.json()

if not res.ok:
    raise RuntimeError(data['error'])
print(data)`,
    },
  ];
}

const DOMAIN_EXAMPLE = {
  domainName: 'github.com',
  registrar: 'MarkMonitor Inc.',
  registrarUrl: 'http://www.markmonitor.com',
  registrarIanaId: '292',
  registrarAbuseEmail: 'abusecomplaints@markmonitor.com',
  registrarAbusePhone: '+1.2086851750',
  dnssec: 'Unsigned',
  registeredOn: 'Tue, 09 Oct 2007 18:20:50 GMT',
  expiresOn: 'Mon, 09 Oct 2028 18:20:50 GMT',
  lastUpdated: 'Mon, 07 Sep 2026 09:18:27 GMT',
  statuses: [
    {
      label: 'Client transfer prohibited',
      url: 'https://icann.org/epp#clienttransferprohibited',
    },
  ],
  nameservers: ['dns1.p08.nsone.net', 'ns-1283.awsdns-32.org'],
  entities: [],
  rdapServer: 'https://rdap.verisign.com/com/v1/',
  rdapUrl: 'https://rdap.verisign.com/com/v1/domain/github.com',
  fetchedAt: '2026-11-21T06:42:10.512Z',
  queryMs: 412,
};

const IP_EXAMPLE = {
  ip: '1.1.1.1',
  type: 'IPv4',
  network: {
    cidr: '1.1.1.0/24',
    handle: '1.1.1.0 - 1.1.1.255',
    name: 'APNIC-LABS',
    country: 'AU',
    organization: 'APNIC Research and Development',
    registrationDate: 'Thu, 15 Jun 2023 04:20:21 GMT',
    lastChanged: 'Thu, 15 Jun 2023 04:20:21 GMT',
    type: 'ASSIGNED PORTABLE',
    status: ['active'],
  },
  entities: [
    {
      handle: 'IRT-APNICRANDNET-AU',
      roles: ['abuse'],
      name: 'IRT-APNICRANDNET-AU',
      email: 'helpdesk@apnic.net',
    },
  ],
  rdapServer: 'https://rdap.apnic.net/',
  rdapUrl: 'https://rdap.apnic.net/ip/1.1.1.1',
  fetchedAt: '2026-11-21T06:42:10.512Z',
  queryMs: 655,
};

const ASN_EXAMPLE = {
  asn: 15169,
  handle: 'AS15169',
  range: { start: 15169, end: 15169 },
  name: 'GOOGLE',
  type: 'DIRECT ALLOCATION',
  status: ['active'],
  organization: 'Google LLC',
  registrationDate: 'Fri, 30 Mar 2000 05:00:00 GMT',
  lastChanged: 'Thu, 07 Mar 2024 16:39:50 GMT',
  entities: [],
  rdapServer: 'https://rdap.arin.net/registry/',
  rdapUrl: 'https://rdap.arin.net/registry/autnum/15169',
  fetchedAt: '2026-11-21T06:42:10.512Z',
  queryMs: 318,
};

const ENDPOINTS = [
  {
    id: 'domain',
    kind: 'domain',
    title: 'Look up a domain',
    path: '/api/lookup/{domain}',
    prefix: '/api/lookup/',
    example: 'github.com',
    body: 'Returns the registration record for a domain from its TLD registry. You can pass a full URL or a subdomain; it is reduced to the registrable domain (www.example.co.uk becomes example.co.uk). Internationalized names are converted to punycode.',
    param: ['domain', 'A domain, subdomain or URL, URL-encoded.'],
    response: DOMAIN_EXAMPLE,
  },
  {
    id: 'ip',
    kind: 'ip',
    title: 'Look up an IP address',
    path: '/api/ip/{address}',
    prefix: '/api/ip/',
    example: '1.1.1.1',
    body: 'Returns the network allocation that contains an IPv4 or IPv6 address, from the regional internet registry that manages it. Private, loopback, multicast and reserved addresses return 400.',
    param: [
      'address',
      'A single IPv4 or IPv6 address, without a prefix length.',
    ],
    response: IP_EXAMPLE,
  },
  {
    id: 'asn',
    kind: 'asn',
    title: 'Look up an ASN',
    path: '/api/asn/{number}',
    prefix: '/api/asn/',
    example: 'AS15169',
    body: 'Returns the registration for an autonomous system number. AS0, AS23456, AS65535 and AS4294967295 are reserved and return 400.',
    param: [
      'number',
      'An AS number, with or without the AS prefix (15169 or AS15169).',
    ],
    response: ASN_EXAMPLE,
  },
] as const;

const ERRORS = [
  [
    '400',
    'input',
    'The value isn’t a valid domain, IP address or ASN, or it is private or reserved.',
  ],
  [
    '404',
    'bootstrap',
    'No registry publishes RDAP for this TLD, address range or AS number.',
  ],
  [
    '404',
    'registry',
    'The registry has no record (for example, an unregistered domain).',
  ],
  [
    '502',
    'registry',
    'The registry answered with an error or invalid data, or could not be reached.',
  ],
  ['504', 'registry', 'The registry didn’t answer within 10 seconds.'],
];

const DOMAIN_FIELDS = [
  ['domainName', 'string', 'The domain, lowercase ASCII.'],
  ['registrar', 'string', 'Registrar name, or "N/A".'],
  ['registrarIanaId', 'string?', 'The registrar’s IANA ID.'],
  ['registrarAbuseEmail', 'string?', 'Where to report abuse, when published.'],
  ['dnssec', 'string', '"Signed", "Unsigned" or "N/A".'],
  [
    'registeredOn / expiresOn / lastUpdated',
    'string',
    'UTC dates (RFC 1123), or "N/A".',
  ],
  [
    'statuses',
    'object[]',
    'EPP status codes, each with a label and its ICANN definition URL.',
  ],
  ['nameservers', 'string[]', 'Delegated nameservers.'],
  [
    'entities',
    'object[]',
    'Other contacts (roles, name, organization, email, phone, handle).',
  ],
  [
    'rdapServer / rdapUrl',
    'string',
    'The registry server used and the exact upstream query.',
  ],
  [
    'fetchedAt',
    'string',
    'When this server queried the registry (ISO 8601). Older than now means a cached answer.',
  ],
  ['queryMs', 'number', 'How long the server’s lookup took, in milliseconds.'],
];

const NAV = [
  ['overview', 'Overview'],
  ['domain', 'Look up a domain'],
  ['ip', 'Look up an IP address'],
  ['asn', 'Look up an ASN'],
  ['errors', 'Errors'],
  ['caching', 'Caching'],
  ['fields', 'Domain response fields'],
];

const h2 = 'font-display text-ink scroll-mt-24 text-4xl';
const h3 = 'text-ink text-[1.0625rem] font-medium';
const prose = 'text-ink-2 max-w-[65ch] text-[1rem] leading-relaxed';

export default function ApiDocs() {
  return (
    <div className='flex min-h-dvh flex-col'>
      <SiteHeader active='api' />
      <div className='mx-auto w-full max-w-6xl flex-1 px-5 pt-12 pb-24 sm:px-8 sm:pt-16 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16'>
        <nav aria-label='On this page' className='max-lg:hidden'>
          <ul className='sticky top-8 space-y-1 text-[0.9375rem]'>
            {NAV.map(([id, label]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className='text-ink-2 hover:text-ink block rounded-md py-1 transition-colors'
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className='min-w-0'>
          <section id='overview' className='scroll-mt-24'>
            <h1 className='font-display text-ink max-w-[18ch] text-5xl leading-[0.95] tracking-tight sm:text-6xl'>
              The RDAPclient API
            </h1>
            <p className={`${prose} mt-5 text-[1.125rem]`}>
              Every lookup on this site is available as JSON. No key, no
              sign-up, and CORS is on, so it works from a browser, a script or a
              server.
            </p>
            <div className='border-line bg-surface mt-8 flex max-w-xl items-center justify-between gap-3 rounded-xl border py-2 pr-2 pl-4'>
              <div className='min-w-0'>
                <p className='text-ink-2 text-[0.8125rem]'>Base URL</p>
                <p className='truncate font-mono text-[0.9375rem]'>{BASE}</p>
              </div>
              <CopyButton text={BASE} />
            </div>
          </section>

          {ENDPOINTS.map((e) => (
            <section
              key={e.id}
              id={e.id}
              data-kind={e.kind}
              className='border-line mt-20 scroll-mt-24 border-t pt-12'
            >
              <h2 className={h2}>{e.title}</h2>
              <p className='mt-4 flex flex-wrap items-center gap-2 font-mono text-[0.9375rem]'>
                <span className='bg-accent-tint text-accent-strong rounded-md px-2 py-0.5 font-medium'>
                  GET
                </span>
                {e.path}
              </p>
              <p className={`${prose} mt-4`}>{e.body}</p>

              <h3 className={`${h3} mt-8 mb-3`}>Path parameter</h3>
              <dl className='border-line divide-line divide-y border-y text-[0.9375rem]'>
                <div className='grid gap-1 py-3 sm:grid-cols-[10rem_1fr]'>
                  <dt className='font-mono'>{e.param[0]}</dt>
                  <dd className='text-ink-2'>{e.param[1]}</dd>
                </div>
              </dl>

              <h3 className={`${h3} mt-8 mb-3`}>Example request</h3>
              <CodeTabs
                samples={samples(`${e.prefix}${encodeURIComponent(e.example)}`)}
              />

              <h3 className={`${h3} mt-8 mb-3`}>Try it</h3>
              <TryIt
                path={e.prefix}
                initial={e.example}
                placeholder={e.example}
                label={`Send a live request for any ${e.param[0]}`}
              />

              <details className='group mt-8'>
                <summary
                  className={`${h3} hover:text-accent-strong cursor-pointer`}
                >
                  Example response
                </summary>
                <p className='text-ink-2 mt-2 mb-3 text-[0.9375rem]'>
                  Shortened. Fields the registry doesn’t publish are left out.
                </p>
                <JsonBlock value={e.response} className='max-h-[28rem]' />
              </details>
            </section>
          ))}

          <section
            id='errors'
            className='border-line mt-20 scroll-mt-24 border-t pt-12'
          >
            <h2 className={h2}>Errors</h2>
            <p className={`${prose} mt-4`}>
              Failed requests return a status code and a JSON body with a
              readable message and the stage where the lookup stopped:
              <span className='font-mono'> input</span> (your value),
              <span className='font-mono'> bootstrap</span> (finding the right
              registry) or <span className='font-mono'>registry</span> (the
              registry itself).
            </p>
            <JsonBlock
              className='mt-5 max-w-xl'
              value={{
                error:
                  'The .notarealtld registry does not publish an RDAP service.',
                stage: 'bootstrap',
              }}
            />
            <div className='mt-6 overflow-x-auto'>
              <table className='w-full min-w-[34rem] text-left text-[0.9375rem]'>
                <thead className='text-ink-2'>
                  <tr className='border-line border-b'>
                    <th className='py-2.5 pr-6 font-medium'>Status</th>
                    <th className='py-2.5 pr-6 font-medium'>Stage</th>
                    <th className='py-2.5 font-medium'>Meaning</th>
                  </tr>
                </thead>
                <tbody className='divide-line divide-y'>
                  {ERRORS.map(([code, stage, meaning]) => (
                    <tr key={`${code}-${stage}-${meaning}`}>
                      <td className='py-3 pr-6 align-top font-mono'>{code}</td>
                      <td className='py-3 pr-6 align-top font-mono'>{stage}</td>
                      <td className='text-ink-2 py-3'>{meaning}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section
            id='caching'
            className='border-line mt-20 scroll-mt-24 border-t pt-12'
          >
            <h2 className={h2}>Caching</h2>
            <p className={`${prose} mt-4`}>
              Successful answers are cached at the edge for an hour and may be
              served stale for up to a day while they refresh. Registration data
              changes slowly, so this keeps lookups fast. Each response says
              when the registry was actually asked (
              <span className='font-mono'>fetchedAt</span>) and how long that
              took (<span className='font-mono'>queryMs</span>). Errors are
              never cached.
            </p>
            <CodeBlock className='mt-5 max-w-xl'>
              Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
            </CodeBlock>
          </section>

          <section
            id='fields'
            className='border-line mt-20 scroll-mt-24 border-t pt-12'
          >
            <h2 className={h2}>Domain response fields</h2>
            <p className={`${prose} mt-4`}>
              IP and ASN responses follow the same pattern; see their example
              responses above.
            </p>
            <div className='mt-6 overflow-x-auto'>
              <table className='w-full min-w-[36rem] text-left text-[0.9375rem]'>
                <thead className='text-ink-2'>
                  <tr className='border-line border-b'>
                    <th className='py-2.5 pr-6 font-medium'>Field</th>
                    <th className='py-2.5 pr-6 font-medium'>Type</th>
                    <th className='py-2.5 font-medium'>Description</th>
                  </tr>
                </thead>
                <tbody className='divide-line divide-y'>
                  {DOMAIN_FIELDS.map(([field, type, desc]) => (
                    <tr key={field}>
                      <td className='py-3 pr-6 align-top font-mono text-[0.875rem]'>
                        {field}
                      </td>
                      <td className='text-ink-2 py-3 pr-6 align-top font-mono text-[0.875rem]'>
                        {type}
                      </td>
                      <td className='text-ink-2 py-3'>{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
      <SiteFooter />
    </div>
  );
}
