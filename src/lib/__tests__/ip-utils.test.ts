/** @jest-environment node */
import {
  isPrivateIP,
  isReservedIP,
  rangeToCidr,
  validateIP,
} from '@/lib/ip-utils';

describe('validateIP', () => {
  it('accepts and canonicalizes IPv4 and IPv6', () => {
    expect(validateIP(' 8.8.8.8 ')).toMatchObject({
      isValid: true,
      version: 'IPv4',
      normalized: '8.8.8.8',
    });
    expect(validateIP('2001:4860:4860:0000:0000:0000:0000:8888')).toMatchObject(
      {
        isValid: true,
        version: 'IPv6',
        normalized: '2001:4860:4860::8888',
      },
    );
  });

  it('rejects garbage and prefixes', () => {
    expect(validateIP('999.1.1.1').isValid).toBe(false);
    expect(validateIP('8.8.8.0/24').isValid).toBe(false);
    expect(validateIP('example.com').isValid).toBe(false);
  });
});

describe('private / reserved ranges', () => {
  it('flags private and reserved addresses', () => {
    expect(isPrivateIP('192.168.1.1')).toBe(true);
    expect(isPrivateIP('fe80::1')).toBe(true);
    expect(isReservedIP('224.0.0.1')).toBe(true);
    expect(isPrivateIP('1.1.1.1')).toBe(false);
  });
});

describe('rangeToCidr', () => {
  it('collapses exact prefixes (including high IPv4 ranges)', () => {
    expect(rangeToCidr('8.8.8.0', '8.8.8.255', 'IPv4')).toBe('8.8.8.0/24');
    expect(rangeToCidr('200.0.0.0', '200.255.255.255', 'IPv4')).toBe(
      '200.0.0.0/8',
    );
    expect(
      rangeToCidr(
        '2001:4860::',
        '2001:4860:ffff:ffff:ffff:ffff:ffff:ffff',
        'IPv6',
      ),
    ).toBe('2001:4860::/32');
  });

  it('falls back to a range when not a single prefix', () => {
    expect(rangeToCidr('10.0.0.0', '10.0.2.255', 'IPv4')).toBe(
      '10.0.0.0 - 10.0.2.255',
    );
  });
});
