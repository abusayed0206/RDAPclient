import { Address4, Address6 } from 'ip-address';

export type IPVersion = 'IPv4' | 'IPv6';

export interface IPValidationResult {
  isValid: boolean;
  version?: IPVersion;
  normalized?: string;
  error?: string;
}

/** Validate a single IP address (no prefix) and return its canonical form. */
export function validateIP(ip: string): IPValidationResult {
  const clean = ip.trim();
  if (!clean || clean.includes('/')) {
    return { isValid: false, error: 'Invalid IP address format' };
  }
  if (Address4.isValid(clean)) {
    return {
      isValid: true,
      version: 'IPv4',
      normalized: new Address4(clean).correctForm(),
    };
  }
  if (Address6.isValid(clean)) {
    return {
      isValid: true,
      version: 'IPv6',
      normalized: new Address6(clean).correctForm(),
    };
  }
  return { isValid: false, error: 'Invalid IP address format' };
}

const PRIVATE_V4 = [
  '10.0.0.0/8',
  '172.16.0.0/12',
  '192.168.0.0/16',
  '127.0.0.0/8',
  '169.254.0.0/16',
].map((r) => new Address4(r));
const PRIVATE_V6 = ['fc00::/7', 'fe80::/10', '::1/128'].map(
  (r) => new Address6(r),
);
const RESERVED_V4 = [
  '0.0.0.0/8',
  '224.0.0.0/4',
  '240.0.0.0/4',
  '255.255.255.255/32',
].map((r) => new Address4(r));
const RESERVED_V6 = ['ff00::/8', '::/128'].map((r) => new Address6(r));

function inRanges(ip: string, v4: Address4[], v6: Address6[]): boolean {
  const { isValid, version, normalized } = validateIP(ip);
  if (!isValid || !normalized) return false;
  if (version === 'IPv4') {
    const addr = new Address4(normalized);
    return v4.some((r) => addr.isInSubnet(r));
  }
  const addr = new Address6(normalized);
  return v6.some((r) => addr.isInSubnet(r));
}

export function isPrivateIP(ip: string): boolean {
  return inRanges(ip, PRIVATE_V4, PRIVATE_V6);
}

export function isReservedIP(ip: string): boolean {
  return inRanges(ip, RESERVED_V4, RESERVED_V6);
}

function toBigInt(ip: string, version: IPVersion): bigint {
  return version === 'IPv4'
    ? new Address4(ip).bigInt()
    : new Address6(ip).bigInt();
}

/**
 * Express an address range as CIDR when it is exactly one prefix,
 * otherwise as "start - end".
 */
export function rangeToCidr(
  start: string,
  end: string,
  version: IPVersion,
): string {
  const bits = version === 'IPv4' ? 32 : 128;
  try {
    const s = toBigInt(start, version);
    const e = toBigInt(end, version);
    const size = e - s + BigInt(1);
    if (size > BigInt(0) && (size & (size - BigInt(1))) === BigInt(0)) {
      const hostBits = size.toString(2).length - 1;
      if (s % size === BigInt(0)) return `${start}/${bits - hostBits}`;
    }
  } catch {
    // fall through
  }
  return `${start} - ${end}`;
}
