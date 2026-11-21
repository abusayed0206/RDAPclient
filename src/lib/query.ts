// Client-side query classification. Kept dependency-free so it stays out of
// the bundle's heavy path; the API routes do the authoritative validation.

export type LookupType = 'domain' | 'ip' | 'asn';

export interface DetectedQuery {
  type: LookupType;
  value: string;
}

const IPV4 =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
const IPV6 = /^[0-9a-f:.]+$/i;
const ASN = /^as\s*(\d{1,10})$/i;
const DIGITS = /^\d{1,10}$/;

export function detectQuery(raw: string): DetectedQuery | null {
  let input = raw.trim();
  if (!input) return null;

  const asn = input.match(ASN);
  if (asn) return { type: 'asn', value: asn[1] };
  if (DIGITS.test(input)) return { type: 'asn', value: input };

  // Allow pasting bracketed IPv6 like [2001:db8::1]
  const unbracketed = input.replace(/^\[(.*)\]$/, '$1');
  if (IPV4.test(unbracketed)) return { type: 'ip', value: unbracketed };
  if (unbracketed.includes(':') && IPV6.test(unbracketed)) {
    return { type: 'ip', value: unbracketed.toLowerCase() };
  }

  // Strip scheme/path so pasted URLs work; the server reduces to the registrable domain.
  input = input
    .replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')
    .split(/[/?#]/)[0]
    .replace(/:\d+$/, '')
    .replace(/\.$/, '')
    .toLowerCase();
  if (input.includes('.') && !/\s/.test(input)) {
    return { type: 'domain', value: input };
  }
  return null;
}

export const lookupLabels: Record<LookupType, string> = {
  domain: 'Domain',
  ip: 'IP address',
  asn: 'ASN',
};

export function apiPath({ type, value }: DetectedQuery): string {
  const segment = type === 'domain' ? 'lookup' : type;
  return `/api/${segment}/${encodeURIComponent(value)}`;
}
