/** @jest-environment node */
import { apiPath, detectQuery } from '@/lib/query';

describe('detectQuery', () => {
  it.each([
    ['AS15169', { type: 'asn', value: '15169' }],
    ['as 13335', { type: 'asn', value: '13335' }],
    ['15169', { type: 'asn', value: '15169' }],
    ['8.8.8.8', { type: 'ip', value: '8.8.8.8' }],
    ['[2001:DB8::1]', { type: 'ip', value: '2001:db8::1' }],
    [
      'https://www.Example.com/path',
      { type: 'domain', value: 'www.example.com' },
    ],
    ['example.com.', { type: 'domain', value: 'example.com' }],
  ])('%s', (input, expected) => {
    expect(detectQuery(input)).toEqual(expected);
  });

  it('returns null for unusable input', () => {
    expect(detectQuery('')).toBeNull();
    expect(detectQuery('hello world')).toBeNull();
    expect(detectQuery('localhost')).toBeNull();
  });

  it('builds API paths', () => {
    expect(apiPath({ type: 'domain', value: 'example.com' })).toBe(
      '/api/lookup/example.com',
    );
    expect(apiPath({ type: 'ip', value: '2001:db8::1' })).toBe(
      '/api/ip/2001%3Adb8%3A%3A1',
    );
  });
});
