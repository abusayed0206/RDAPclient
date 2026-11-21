/** @jest-environment node */
import { validateASN } from '@/lib/asn-rdap';
import { normalizeDomainInput, normalizeRdapResponse } from '@/lib/rdap';

describe('normalizeDomainInput', () => {
  it('reduces URLs and subdomains to the registrable domain', () => {
    expect(normalizeDomainInput('https://www.Example.co.uk/path?q=1')).toBe(
      'example.co.uk',
    );
    expect(normalizeDomainInput('mail.google.com')).toBe('google.com');
  });

  it('punycodes IDNs', () => {
    expect(normalizeDomainInput('bücher.de')).toBe('xn--bcher-kva.de');
  });

  it('rejects non-domains', () => {
    expect(normalizeDomainInput('')).toBeNull();
    expect(normalizeDomainInput('8.8.8.8')).toBeNull();
    expect(normalizeDomainInput('localhost')).toBeNull();
  });
});

describe('normalizeRdapResponse', () => {
  const registrar = {
    roles: ['registrar'],
    publicIds: [{ type: 'IANA Registrar ID', identifier: '1910' }],
    vcardArray: [
      'vcard',
      [
        ['version', {}, 'text', '4.0'],
        ['fn', {}, 'text', 'CloudFlare, Inc.'],
      ],
    ],
    entities: [
      {
        roles: ['abuse'],
        vcardArray: [
          'vcard',
          [
            ['email', {}, 'text', 'abuse@example.net'],
            ['tel', { type: 'voice' }, 'uri', 'tel:+1.5555551234'],
          ],
        ],
      },
    ],
  };

  const result = normalizeRdapResponse(
    {
      ldhName: 'EXAMPLE.DEV',
      status: ['client transfer prohibited'],
      events: [
        { eventAction: 'registration', eventDate: '2021-09-19T15:18:19Z' },
        { eventAction: 'last update', eventDate: '2025-06-11T10:02:34Z' },
      ],
      secureDNS: { delegationSigned: true },
      nameservers: [{ ldhName: 'LARA.NS.CLOUDFLARE.COM' }],
      entities: [registrar as never],
    },
    'https://rdap.example/',
    'https://rdap.example/domain/example.dev',
  );

  it('extracts registrar and nested abuse contact', () => {
    expect(result.registrar).toBe('CloudFlare, Inc.');
    expect(result.registrarIanaId).toBe('1910');
    expect(result.registrarAbuseEmail).toBe('abuse@example.net');
    expect(result.registrarAbusePhone).toBe('+1.5555551234');
  });

  it('falls back to "last update" when "last changed" is missing', () => {
    expect(result.lastUpdated).toBe('Wed, 11 Jun 2025 10:02:34 GMT');
    expect(result.expiresOn).toBe('N/A');
  });

  it('normalizes statuses, nameservers and DNSSEC', () => {
    expect(result.domainName).toBe('example.dev');
    expect(result.statuses).toEqual([
      {
        label: 'Client transfer prohibited',
        url: 'https://icann.org/epp#clienttransferprohibited',
      },
    ]);
    expect(result.nameservers).toEqual(['lara.ns.cloudflare.com']);
    expect(result.dnssec).toBe('Signed');
    expect(result.entities).toEqual([]);
  });
});

describe('validateASN', () => {
  it('accepts AS-prefixed and bare numbers', () => {
    expect(validateASN('AS15169')).toEqual({
      isValid: true,
      normalized: 15169,
    });
    expect(validateASN(' as 13335')).toEqual({
      isValid: true,
      normalized: 13335,
    });
  });
  it('rejects reserved and malformed values', () => {
    expect(validateASN('0').isValid).toBe(false);
    expect(validateASN('AS4294967296').isValid).toBe(false);
    expect(validateASN('abc').isValid).toBe(false);
  });
});
