'use client';

import {
  Activity,
  Clock,
  FileText,
  Globe,
  MessageSquare,
  Moon,
  Network,
  Search,
  Server,
  ShieldCheck,
  Sun,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { parse } from 'tldts';

import { NormalizedRdapData } from '@/lib/rdap';

interface IPData {
  ip: string;
  type: string;
  network: {
    cidr?: string;
    name?: string;
    country?: string;
    organization?: string;
    registrar?: string;
    registrationDate?: string;
    lastChanged?: string;
    type?: string;
    status?: string[];
  };
  entities?: Array<{
    handle?: string;
    roles?: string[];
    name?: string;
    email?: string;
    organization?: string;
  }>;
  remarks?: Array<{
    title?: string;
    description?: string[];
  }>;
  rdapServer: string;
}

interface AsnData {
  asn: number;
  range: {
    start: number;
    end: number;
  };
  name?: string;
  type?: string;
  status?: string[];
  country?: string;
  organization?: string;
  registrar?: string;
  registrationDate?: string;
  lastChanged?: string;
  remarks?: Array<{
    title?: string;
    description?: string[];
  }>;
  rdapServer: string;
}

type LookupType = 'domain' | 'ip' | 'asn';

export default function Home() {
  const [lookupType, setLookupType] = useState<LookupType>('domain');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: 'info' });
  const [domainResults, setDomainResults] = useState<NormalizedRdapData | null>(
    null,
  );
  const [ipResults, setIpResults] = useState<IPData | null>(null);
  const [asnResults, setAsnResults] = useState<AsnData | null>(null);
  const [mode, setMode] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode');
    if (savedMode && (savedMode === 'dark' || savedMode === 'light')) {
      setMode(savedMode);
    } else {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)',
      ).matches;
      setMode(prefersDark ? 'dark' : 'light');
    }
    setStatus({
      message: 'Ready to look up domains, IP addresses, and ASNs.',
      type: 'success',
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  const toggleMode = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  const clearResults = () => {
    setDomainResults(null);
    setIpResults(null);
    setAsnResults(null);

    const typeMap: Record<LookupType, string> = {
      domain: 'IP addresses and ASNs',
      ip: 'domains and ASNs',
      asn: 'domains and IP addresses',
    };

    setStatus({
      message: `Ready to look up ${typeMap[lookupType]}.`,
      type: 'success',
    });
  };

  const handleLookupTypeChange = (type: LookupType) => {
    setLookupType(type);
    setInput('');
    clearResults();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const rawInput = input.trim().toLowerCase();

    if (lookupType === 'domain') {
      const parsed = parse(rawInput);
      if (!parsed.domain) {
        setStatus({
          message: 'Please enter a valid domain name.',
          type: 'warn',
        });
        return;
      }
      await lookupDomain(parsed.domain);
    } else if (lookupType === 'ip') {
      if (!isValidIP(rawInput)) {
        setStatus({
          message: 'Please enter a valid IP address.',
          type: 'warn',
        });
        return;
      }
      await lookupIP(rawInput);
    } else if (lookupType === 'asn') {
      const asnNum = rawInput.replace(/^as/i, '').trim();
      if (!/^\d+$/.test(asnNum)) {
        setStatus({
          message: 'Please enter a valid ASN (e.g., AS15169 or 15169).',
          type: 'warn',
        });
        return;
      }
      await lookupASN(asnNum);
    }
  };
  const isValidIP = (ip: string): boolean => {
    try {
      const cleanIP = ip.trim();

      // Check IPv4 - basic but comprehensive regex
      const ipv4Regex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      if (ipv4Regex.test(cleanIP)) {
        return true;
      }

      // Check IPv6 - comprehensive regex that handles :: notation
      // This regex handles all IPv6 formats including compressed notation with ::
      const ipv6Regex =
        /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

      return ipv6Regex.test(cleanIP);
    } catch (error) {
      return false;
    }
  };

  const lookupDomain = async (domain: string) => {
    setIsLoading(true);
    clearResults();
    setStatus({ message: `Looking up ${domain}...`, type: 'info' });

    try {
      const response = await fetch(`/api/lookup/${domain}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'API error.');
      setDomainResults(data);
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('Domain lookup failed:', error);
      setStatus({
        message: (error as Error).message || 'Unknown error.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const lookupIP = async (ip: string) => {
    setIsLoading(true);
    clearResults();
    setStatus({ message: `Looking up ${ip}...`, type: 'info' });

    try {
      const response = await fetch(`/api/ip/${ip}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'API error.');
      setIpResults(data);
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('IP lookup failed:', error);
      setStatus({
        message: (error as Error).message || 'Unknown error.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const lookupASN = async (asn: string) => {
    setIsLoading(true);
    clearResults();
    setStatus({ message: `Looking up AS${asn}...`, type: 'info' });

    try {
      const response = await fetch(`/api/asn/${asn}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'API error.');
      setAsnResults(data);
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('ASN lookup failed:', error);
      setStatus({
        message: (error as Error).message || 'Unknown error.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'success':
        return mode === 'dark' ? 'text-green-400' : 'text-green-600';
      case 'warn':
        return mode === 'dark' ? 'text-amber-400' : 'text-amber-600';
      case 'error':
        return mode === 'dark' ? 'text-red-400' : 'text-red-600';
      default:
        return mode === 'dark' ? 'text-slate-400' : 'text-slate-500';
    }
  };

  const getRdapDomainUrl = (baseUrl: string, domainName: string): string => {
    const url = new URL(baseUrl);
    const basePath = url.pathname.endsWith('/')
      ? url.pathname
      : `${url.pathname}/`;
    url.pathname = `${basePath}domain/${domainName}`;
    return url.toString();
  };

  const getRdapIpUrl = (baseUrl: string, ip: string): string => {
    const url = new URL(baseUrl);
    const basePath = url.pathname.endsWith('/')
      ? url.pathname
      : `${url.pathname}/`;
    url.pathname = `${basePath}ip/${ip}`;
    return url.toString();
  };

  return (
    <main
      className={`flex min-h-screen items-center justify-center px-4 py-8 transition-colors duration-300 ${
        mode === 'dark'
          ? 'bg-gradient-to-br from-gray-900 to-gray-800'
          : 'bg-gradient-to-br from-blue-50 to-indigo-100'
      }`}
    >
      <div
        className={`flex w-full max-w-4xl flex-col items-center rounded-2xl p-6 shadow-2xl transition-colors duration-300 sm:p-8 ${
          mode === 'dark'
            ? 'border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900'
            : 'border border-indigo-100 bg-white'
        }`}
      >
        <header className='mb-8 text-center'>
          <div className='right-4 top-4'>
            <button
              onClick={toggleMode}
              className={`
              inline-flex items-center justify-center rounded-full p-2 text-lg font-semibold
              transition-colors duration-300
              ${
                mode === 'dark'
                  ? 'text-yellow-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800'
                  : 'text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white'
              }
            `}
              aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
            >
              {mode === 'dark' ? (
                <Sun className='h-6 w-6' />
              ) : (
                <Moon className='h-6 w-6' />
              )}
            </button>
          </div>

          <h1
            className={`text-3xl font-bold transition-colors duration-300 md:text-4xl ${
              mode === 'dark' ? 'text-white' : 'text-indigo-900'
            }`}
          >
            RDAP Lookup
          </h1>
          <p
            className={`mt-2 transition-colors duration-300 ${
              mode === 'dark' ? 'text-indigo-200' : 'text-indigo-600'
            }`}
          >
            Comprehensive RDAP lookups for domains, IP addresses, and ASNs
          </p>
        </header>

        {/* Lookup Type Selector */}
        <div
          className={`mb-6 rounded-lg border-2 p-1 transition-colors duration-300 ${
            mode === 'dark'
              ? 'border-gray-600 bg-gray-700'
              : 'border-gray-200 bg-gray-100'
          }`}
        >
          <div className='flex'>
            <button
              onClick={() => handleLookupTypeChange('domain')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                lookupType === 'domain'
                  ? mode === 'dark'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-indigo-600 shadow-md'
                  : mode === 'dark'
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Globe className='mr-2 inline h-4 w-4' />
              Domain
            </button>
            <button
              onClick={() => handleLookupTypeChange('ip')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                lookupType === 'ip'
                  ? mode === 'dark'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-indigo-600 shadow-md'
                  : mode === 'dark'
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Server className='mr-2 inline h-4 w-4' />
              IP Address
            </button>
            <button
              onClick={() => handleLookupTypeChange('asn')}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors duration-300 ${
                lookupType === 'asn'
                  ? mode === 'dark'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white text-indigo-600 shadow-md'
                  : mode === 'dark'
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Network className='mr-2 inline h-4 w-4' />
              ASN
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className='mb-6 flex w-full flex-col gap-4 sm:flex-row'
        >
          <div className='relative flex-grow'>
            <input
              type='text'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                lookupType === 'domain'
                  ? 'e.g., google.com'
                  : lookupType === 'ip'
                    ? 'e.g., 8.8.8.8 or 2001:4860:4860::8888'
                    : 'e.g., AS15169 or 15169'
              }
              className={`w-full rounded-lg border-2 px-4 py-3 text-lg transition-colors duration-300 focus:outline-none focus:ring-2 ${
                mode === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500'
                  : 'border-indigo-200 bg-white focus:border-indigo-500 focus:ring-indigo-500'
              }`}
            />
          </div>
          <button
            type='submit'
            disabled={isLoading}
            className={`
              flex w-full transform items-center justify-center gap-2 rounded-lg
              px-6 py-3 text-lg font-semibold
              transition-colors duration-300 active:scale-95 sm:w-auto
              ${
                isLoading
                  ? 'cursor-not-allowed bg-indigo-400'
                  : mode === 'dark'
                    ? 'border-indigo-700 bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700'
                    : 'border-indigo-700 bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700'
              }
            `}
          >
            {isLoading ? (
              <div className='h-6 w-6 animate-spin rounded-full border-4 border-white border-t-transparent' />
            ) : (
              <>
                <Search className='h-5 w-5' />
                <span>Lookup</span>
              </>
            )}
          </button>
        </form>

        {!domainResults &&
          !ipResults &&
          status.message &&
          status.type !== 'error' && (
            <p
              className={`mb-4 text-center font-medium ${getStatusColor(status.type)}`}
            >
              {status.message}
            </p>
          )}

        {/* Domain Results */}
        {domainResults && domainResults.rdapServer && (
          <div
            className={`mb-6 w-full rounded-lg p-3 text-center transition-colors duration-300 ${
              mode === 'dark'
                ? 'border border-indigo-800 bg-indigo-900/20 text-indigo-200'
                : 'border border-indigo-100 bg-indigo-50 text-indigo-700'
            }`}
          >
            <p className='text-sm'>
              Domain information retrieved from{' '}
              <a
                href={getRdapDomainUrl(
                  domainResults.rdapServer,
                  domainResults.domainName,
                )}
                target='_blank'
                rel='noopener noreferrer'
                className={`font-medium hover:underline ${
                  mode === 'dark' ? 'text-indigo-300' : 'text-indigo-600'
                }`}
              >
                {new URL(domainResults.rdapServer).hostname}
              </a>
            </p>
          </div>
        )}

        {/* IP Results */}
        {ipResults && (
          <div
            className={`mb-6 w-full rounded-lg p-3 text-center transition-colors duration-300 ${
              mode === 'dark'
                ? 'border border-indigo-800 bg-indigo-900/20 text-indigo-200'
                : 'border border-indigo-100 bg-indigo-50 text-indigo-700'
            }`}
          >
            <p className='text-sm'>
              IP information retrieved from{' '}
              <a
                href={getRdapIpUrl(ipResults.rdapServer, ipResults.ip)}
                target='_blank'
                rel='noopener noreferrer'
                className={`font-medium hover:underline ${
                  mode === 'dark' ? 'text-indigo-300' : 'text-indigo-600'
                }`}
              >
                {new URL(ipResults.rdapServer).hostname}
              </a>
            </p>
          </div>
        )}

        {/* Domain Results Display */}
        {domainResults && (
          <div
            className={`w-full space-y-6 rounded-xl border p-6 transition-colors duration-300 ${
              mode === 'dark'
                ? 'to-gray-750 border-gray-700 bg-gradient-to-br from-gray-800'
                : 'border-indigo-100 bg-white'
            }`}
          >
            <section className='space-y-5'>
              {/* Domain Details Card */}
              <div
                className={`rounded-lg p-5 shadow-md transition-colors duration-300 ${
                  mode === 'dark'
                    ? 'bg-gray-750 border border-gray-700'
                    : 'border border-indigo-100 bg-white'
                }`}
              >
                <div className='mb-3 flex items-center'>
                  <div
                    className={`mr-2 rounded-md p-1.5 ${
                      mode === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
                    }`}
                  >
                    <Globe
                      className={`h-5 w-5 ${mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}
                    />
                  </div>
                  <h3
                    className={`text-lg font-bold transition-colors duration-300 ${
                      mode === 'dark' ? 'text-white' : 'text-indigo-900'
                    }`}
                  >
                    Domain Details
                  </h3>
                </div>
                <dl className='grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2'>
                  <dt
                    className={`font-medium transition-colors duration-300 ${
                      mode === 'dark' ? 'text-indigo-200' : 'text-indigo-600'
                    }`}
                  >
                    Domain Name
                  </dt>
                  <dd
                    className={`font-mono transition-colors duration-300 ${
                      mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    {domainResults.domainName}
                  </dd>
                  <dt
                    className={`font-medium transition-colors duration-300 ${
                      mode === 'dark' ? 'text-indigo-200' : 'text-indigo-600'
                    }`}
                  >
                    Registrar
                  </dt>
                  <dd
                    className={`transition-colors duration-300 ${
                      mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    {domainResults.registrarUrl ? (
                      <a
                        href={domainResults.registrarUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                        className={`hover:underline ${
                          mode === 'dark'
                            ? 'text-indigo-300'
                            : 'text-indigo-600'
                        }`}
                      >
                        {domainResults.registrar}
                      </a>
                    ) : (
                      domainResults.registrar
                    )}
                  </dd>
                  {domainResults.registrarAbuseEmail && (
                    <>
                      <dt
                        className={`font-medium transition-colors duration-300 ${
                          mode === 'dark'
                            ? 'text-indigo-200'
                            : 'text-indigo-600'
                        }`}
                      >
                        Abuse Contact
                      </dt>
                      <dd
                        className={`transition-colors duration-300 ${
                          mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                        }`}
                      >
                        <a
                          href={`mailto:${domainResults.registrarAbuseEmail}`}
                          className={`hover:underline ${
                            mode === 'dark'
                              ? 'text-indigo-300'
                              : 'text-indigo-600'
                          }`}
                        >
                          {domainResults.registrarAbuseEmail}
                        </a>
                        {domainResults.registrarAbusePhone && (
                          <span className='ml-2 text-xs'>
                            ({domainResults.registrarAbusePhone})
                          </span>
                        )}
                      </dd>
                    </>
                  )}
                  <dt
                    className={`font-medium transition-colors duration-300 ${
                      mode === 'dark' ? 'text-indigo-200' : 'text-indigo-600'
                    }`}
                  >
                    DNSSEC
                  </dt>
                  <dd
                    className={`font-semibold ${domainResults.dnssec === 'Signed' ? 'text-green-500' : 'text-amber-500'}`}
                  >
                    {domainResults.dnssec}
                  </dd>
                </dl>
              </div>

              {/* Important Dates Card */}
              <div
                className={`rounded-lg p-5 shadow-md transition-colors duration-300 ${
                  mode === 'dark'
                    ? 'bg-gray-750 border border-gray-700'
                    : 'border border-indigo-100 bg-white'
                }`}
              >
                <div className='mb-3 flex items-center'>
                  <div
                    className={`mr-2 rounded-md p-1.5 ${
                      mode === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
                    }`}
                  >
                    <Clock
                      className={`h-5 w-5 ${mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}
                    />
                  </div>
                  <h3
                    className={`text-lg font-bold transition-colors duration-300 ${
                      mode === 'dark' ? 'text-white' : 'text-indigo-900'
                    }`}
                  >
                    Important Dates
                  </h3>
                </div>
                <dl className='grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2'>
                  <dt
                    className={`font-medium transition-colors duration-300 ${
                      mode === 'dark' ? 'text-indigo-200' : 'text-indigo-600'
                    }`}
                  >
                    Registered On
                  </dt>
                  <dd
                    className={`transition-colors duration-300 ${
                      mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    {domainResults.registeredOn}
                  </dd>
                  <dt
                    className={`font-medium transition-colors duration-300 ${
                      mode === 'dark' ? 'text-indigo-200' : 'text-indigo-600'
                    }`}
                  >
                    Expires On
                  </dt>
                  <dd
                    className={`transition-colors duration-300 ${
                      mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    {domainResults.expiresOn}
                  </dd>
                  <dt
                    className={`font-medium transition-colors duration-300 ${
                      mode === 'dark' ? 'text-indigo-200' : 'text-indigo-600'
                    }`}
                  >
                    Last Updated
                  </dt>
                  <dd
                    className={`transition-colors duration-300 ${
                      mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    {domainResults.lastUpdated}
                  </dd>
                  {domainResults.lastTransferred &&
                    domainResults.lastTransferred !== 'N/A' && (
                      <>
                        <dt
                          className={`font-medium transition-colors duration-300 ${
                            mode === 'dark'
                              ? 'text-indigo-200'
                              : 'text-indigo-600'
                          }`}
                        >
                          Last Transferred
                        </dt>
                        <dd
                          className={`transition-colors duration-300 ${
                            mode === 'dark'
                              ? 'text-slate-200'
                              : 'text-slate-900'
                          }`}
                        >
                          {domainResults.lastTransferred}
                        </dd>
                      </>
                    )}
                </dl>
              </div>

              <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
                {/* Domain Status Card */}
                <div
                  className={`rounded-lg p-5 shadow-md transition-colors duration-300 ${
                    mode === 'dark'
                      ? 'bg-gray-750 border border-gray-700'
                      : 'border border-indigo-100 bg-white'
                  }`}
                >
                  <div className='mb-3 flex items-center'>
                    <div
                      className={`mr-2 rounded-md p-1.5 ${
                        mode === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
                      }`}
                    >
                      <ShieldCheck
                        className={`h-5 w-5 ${mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}
                      />
                    </div>
                    <h3
                      className={`text-lg font-bold transition-colors duration-300 ${
                        mode === 'dark' ? 'text-white' : 'text-indigo-900'
                      }`}
                    >
                      Domain Status
                    </h3>
                  </div>
                  <ul className='list-none space-y-2.5'>
                    {domainResults.statuses.map((s, i) => (
                      <li key={i} className='flex items-start'>
                        <span
                          className={`mr-2 mt-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                            mode === 'dark' ? 'bg-indigo-400' : 'bg-indigo-600'
                          }`}
                        ></span>
                        <a
                          href={s.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className={`text-sm ${
                            mode === 'dark'
                              ? 'text-indigo-300 hover:text-indigo-200'
                              : 'text-indigo-600 hover:text-indigo-800'
                          } hover:underline`}
                        >
                          {s.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Nameservers Card */}
                <div
                  className={`rounded-lg p-5 shadow-md transition-colors duration-300 ${
                    mode === 'dark'
                      ? 'bg-gray-750 border border-gray-700'
                      : 'border border-indigo-100 bg-white'
                  }`}
                >
                  <div className='mb-3 flex items-center'>
                    <div
                      className={`mr-2 rounded-md p-1.5 ${
                        mode === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
                      }`}
                    >
                      <Server
                        className={`h-5 w-5 ${mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}
                      />
                    </div>
                    <h3
                      className={`text-lg font-bold transition-colors duration-300 ${
                        mode === 'dark' ? 'text-white' : 'text-indigo-900'
                      }`}
                    >
                      Nameservers
                    </h3>
                  </div>
                  <ul className='list-none space-y-2.5'>
                    {domainResults.nameservers.map((ns, i) => (
                      <li key={i} className='flex items-start'>
                        <span
                          className={`mr-2 mt-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                            mode === 'dark' ? 'bg-indigo-400' : 'bg-indigo-600'
                          }`}
                        ></span>
                        <span
                          className={`font-mono text-sm ${
                            mode === 'dark'
                              ? 'text-slate-200'
                              : 'text-slate-900'
                          }`}
                        >
                          {ns}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Domain Entities */}
              {domainResults.entities && domainResults.entities.length > 0 && (
                <div
                  className={`rounded-lg p-5 shadow-md transition-colors duration-300 ${
                    mode === 'dark'
                      ? 'bg-gray-750 border border-gray-700'
                      : 'border border-indigo-100 bg-white'
                  }`}
                >
                  <h3
                    className={`mb-3 text-lg font-bold transition-colors duration-300 ${
                      mode === 'dark' ? 'text-white' : 'text-indigo-900'
                    }`}
                  >
                    Registry Entities
                  </h3>
                  <div className='space-y-4'>
                    {domainResults.entities.map((entity, idx) => (
                      <div
                        key={idx}
                        className={`rounded-md p-3 ${
                          mode === 'dark' ? 'bg-gray-800/50' : 'bg-indigo-50/50'
                        }`}
                      >
                        {entity.name && (
                          <p
                            className={`font-semibold ${
                              mode === 'dark'
                                ? 'text-indigo-200'
                                : 'text-indigo-600'
                            }`}
                          >
                            {entity.name}
                            {entity.organization &&
                              entity.organization !== entity.name && (
                                <span className='ml-2 text-xs font-normal'>
                                  ({entity.organization})
                                </span>
                              )}
                          </p>
                        )}
                        {entity.roles && entity.roles.length > 0 && (
                          <p className='mt-1 text-xs'>
                            <span
                              className={`font-medium ${
                                mode === 'dark'
                                  ? 'text-slate-400'
                                  : 'text-slate-600'
                              }`}
                            >
                              Roles:{' '}
                            </span>
                            <span
                              className={`${
                                mode === 'dark'
                                  ? 'text-slate-300'
                                  : 'text-slate-700'
                              }`}
                            >
                              {entity.roles.join(', ')}
                            </span>
                          </p>
                        )}
                        {entity.email && (
                          <p className='mt-1 text-xs'>
                            <a
                              href={`mailto:${entity.email}`}
                              className={`hover:underline ${
                                mode === 'dark'
                                  ? 'text-indigo-300'
                                  : 'text-indigo-600'
                              }`}
                            >
                              {entity.email}
                            </a>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Domain Remarks */}
              {domainResults.remarks && domainResults.remarks.length > 0 && (
                <div
                  className={`rounded-lg p-5 shadow-md transition-colors duration-300 ${
                    mode === 'dark'
                      ? 'bg-gray-750 border border-gray-700'
                      : 'border border-indigo-100 bg-white'
                  }`}
                >
                  <h3
                    className={`mb-3 text-lg font-bold transition-colors duration-300 ${
                      mode === 'dark' ? 'text-white' : 'text-indigo-900'
                    }`}
                  >
                    Remarks
                  </h3>
                  {domainResults.remarks.map((remark, idx) => (
                    <div key={idx} className='mb-3 last:mb-0'>
                      {remark.title && (
                        <h4
                          className={`mb-1 font-semibold ${
                            mode === 'dark'
                              ? 'text-indigo-200'
                              : 'text-indigo-600'
                          }`}
                        >
                          {remark.title}
                        </h4>
                      )}
                      {remark.description &&
                        remark.description.map((desc, didx) => (
                          <p
                            key={didx}
                            className={`text-sm ${
                              mode === 'dark'
                                ? 'text-slate-200'
                                : 'text-slate-900'
                            }`}
                          >
                            {desc}
                          </p>
                        ))}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Raw RDAP link at the bottom of results */}
            {domainResults.rdapServer && (
              <div className='pt-1 text-center'>
                <a
                  href={getRdapDomainUrl(
                    domainResults.rdapServer,
                    domainResults.domainName,
                  )}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={`inline-flex items-center gap-1 text-xs hover:underline ${
                    mode === 'dark'
                      ? 'text-indigo-300 hover:text-indigo-200'
                      : 'text-indigo-600 hover:text-indigo-800'
                  }`}
                >
                  <FileText className='h-3.5 w-3.5' />
                  RAW JSON
                </a>
              </div>
            )}
          </div>
        )}

        {/* IP Results Display */}
        {ipResults && (
          <div
            className={`w-full space-y-6 rounded-xl border p-6 transition-colors duration-300 ${
              mode === 'dark'
                ? 'to-gray-750 border-gray-700 bg-gradient-to-br from-gray-800'
                : 'border-indigo-100 bg-white'
            }`}
          >
            <section className='space-y-5'>
              {/* Network Details Card */}
              <div
                className={`rounded-lg p-5 shadow-md transition-colors duration-300 ${
                  mode === 'dark'
                    ? 'bg-gray-750 border border-gray-700'
                    : 'border border-indigo-100 bg-white'
                }`}
              >
                <div className='mb-3 flex items-center'>
                  <div
                    className={`mr-2 rounded-md p-1.5 ${
                      mode === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
                    }`}
                  >
                    <Server
                      className={`h-5 w-5 ${mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}
                    />
                  </div>
                  <h3
                    className={`text-lg font-bold transition-colors duration-300 ${
                      mode === 'dark' ? 'text-white' : 'text-indigo-900'
                    }`}
                  >
                    Network Details
                  </h3>
                </div>
                <dl className='grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2'>
                  <dt
                    className={`font-medium transition-colors duration-300 ${
                      mode === 'dark' ? 'text-indigo-200' : 'text-indigo-600'
                    }`}
                  >
                    IP Address
                  </dt>
                  <dd
                    className={`font-mono transition-colors duration-300 ${
                      mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    {ipResults.ip}
                  </dd>
                  <dt
                    className={`font-medium transition-colors duration-300 ${
                      mode === 'dark' ? 'text-indigo-200' : 'text-indigo-600'
                    }`}
                  >
                    Type
                  </dt>
                  <dd
                    className={`transition-colors duration-300 ${
                      mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    {ipResults.type}
                  </dd>
                  {ipResults.network.cidr && (
                    <>
                      <dt
                        className={`font-medium transition-colors duration-300 ${
                          mode === 'dark'
                            ? 'text-indigo-200'
                            : 'text-indigo-600'
                        }`}
                      >
                        CIDR
                      </dt>
                      <dd
                        className={`font-mono transition-colors duration-300 ${
                          mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                        }`}
                      >
                        {ipResults.network.cidr}
                      </dd>
                    </>
                  )}
                  {ipResults.network.name && (
                    <>
                      <dt
                        className={`font-medium transition-colors duration-300 ${
                          mode === 'dark'
                            ? 'text-indigo-200'
                            : 'text-indigo-600'
                        }`}
                      >
                        Network Name
                      </dt>
                      <dd
                        className={`transition-colors duration-300 ${
                          mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                        }`}
                      >
                        {ipResults.network.name}
                      </dd>
                    </>
                  )}
                  {ipResults.network.country && (
                    <>
                      <dt
                        className={`font-medium transition-colors duration-300 ${
                          mode === 'dark'
                            ? 'text-indigo-200'
                            : 'text-indigo-600'
                        }`}
                      >
                        Country
                      </dt>
                      <dd
                        className={`transition-colors duration-300 ${
                          mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                        }`}
                      >
                        {ipResults.network.country}
                      </dd>
                    </>
                  )}
                  {ipResults.network.organization && (
                    <>
                      <dt
                        className={`font-medium transition-colors duration-300 ${
                          mode === 'dark'
                            ? 'text-indigo-200'
                            : 'text-indigo-600'
                        }`}
                      >
                        Organization
                      </dt>
                      <dd
                        className={`transition-colors duration-300 ${
                          mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                        }`}
                      >
                        {ipResults.network.organization}
                      </dd>
                    </>
                  )}
                  {ipResults.network.type && (
                    <>
                      <dt
                        className={`font-medium transition-colors duration-300 ${
                          mode === 'dark'
                            ? 'text-indigo-200'
                            : 'text-indigo-600'
                        }`}
                      >
                        Network Type
                      </dt>
                      <dd
                        className={`transition-colors duration-300 ${
                          mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                        }`}
                      >
                        {ipResults.network.type}
                      </dd>
                    </>
                  )}
                  {ipResults.network.status &&
                    ipResults.network.status.length > 0 && (
                      <>
                        <dt
                          className={`font-medium transition-colors duration-300 ${
                            mode === 'dark'
                              ? 'text-indigo-200'
                              : 'text-indigo-600'
                          }`}
                        >
                          Status
                        </dt>
                        <dd
                          className={`transition-colors duration-300 ${
                            mode === 'dark'
                              ? 'text-slate-200'
                              : 'text-slate-900'
                          }`}
                        >
                          {ipResults.network.status.map((s) => (
                            <span
                              key={s}
                              className={`mr-2 inline-block rounded px-2 py-1 text-xs ${
                                mode === 'dark'
                                  ? 'bg-green-900/30 text-green-300'
                                  : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {s}
                            </span>
                          ))}
                        </dd>
                      </>
                    )}
                </dl>
              </div>

              {/* Network Dates Card */}
              {(ipResults.network.registrationDate ||
                ipResults.network.lastChanged) && (
                <div
                  className={`rounded-lg p-5 shadow-md transition-colors duration-300 ${
                    mode === 'dark'
                      ? 'bg-gray-750 border border-gray-700'
                      : 'border border-indigo-100 bg-white'
                  }`}
                >
                  <div className='mb-3 flex items-center'>
                    <div
                      className={`mr-2 rounded-md p-1.5 ${
                        mode === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
                      }`}
                    >
                      <Clock
                        className={`h-5 w-5 ${mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}
                      />
                    </div>
                    <h3
                      className={`text-lg font-bold transition-colors duration-300 ${
                        mode === 'dark' ? 'text-white' : 'text-indigo-900'
                      }`}
                    >
                      Network Registration
                    </h3>
                  </div>
                  <dl className='grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2'>
                    {ipResults.network.registrationDate && (
                      <>
                        <dt
                          className={`font-medium transition-colors duration-300 ${
                            mode === 'dark'
                              ? 'text-indigo-200'
                              : 'text-indigo-600'
                          }`}
                        >
                          Registered On
                        </dt>
                        <dd
                          className={`transition-colors duration-300 ${
                            mode === 'dark'
                              ? 'text-slate-200'
                              : 'text-slate-900'
                          }`}
                        >
                          {ipResults.network.registrationDate}
                        </dd>
                      </>
                    )}
                    {ipResults.network.lastChanged && (
                      <>
                        <dt
                          className={`font-medium transition-colors duration-300 ${
                            mode === 'dark'
                              ? 'text-indigo-200'
                              : 'text-indigo-600'
                          }`}
                        >
                          Last Changed
                        </dt>
                        <dd
                          className={`transition-colors duration-300 ${
                            mode === 'dark'
                              ? 'text-slate-200'
                              : 'text-slate-900'
                          }`}
                        >
                          {ipResults.network.lastChanged}
                        </dd>
                      </>
                    )}
                  </dl>
                </div>
              )}
            </section>

            {/* IP Entities Section */}
            {ipResults.entities && ipResults.entities.length > 0 && (
              <section>
                <div
                  className={`rounded-lg p-5 shadow-md transition-colors duration-300 ${
                    mode === 'dark'
                      ? 'bg-gray-750 border border-gray-700'
                      : 'border border-indigo-100 bg-white'
                  }`}
                >
                  <div className='mb-4 flex items-center'>
                    <div
                      className={`mr-2 rounded-md p-1.5 ${
                        mode === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
                      }`}
                    >
                      <Users
                        className={`h-5 w-5 ${mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}
                      />
                    </div>
                    <h3
                      className={`text-lg font-bold transition-colors duration-300 ${
                        mode === 'dark' ? 'text-white' : 'text-indigo-900'
                      }`}
                    >
                      Network Entities
                    </h3>
                  </div>
                  <div className='space-y-3'>
                    {ipResults.entities.map((entity, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg p-3 ${
                          mode === 'dark'
                            ? 'border border-gray-600/50 bg-gray-800/50'
                            : 'border border-indigo-100 bg-indigo-50/50'
                        }`}
                      >
                        {entity.name && (
                          <p
                            className={`font-medium ${
                              mode === 'dark'
                                ? 'text-indigo-300'
                                : 'text-indigo-700'
                            }`}
                          >
                            {entity.name}
                          </p>
                        )}
                        {entity.organization && (
                          <p
                            className={`text-sm ${
                              mode === 'dark'
                                ? 'text-slate-300'
                                : 'text-slate-700'
                            }`}
                          >
                            {entity.organization}
                          </p>
                        )}
                        {entity.handle && (
                          <p
                            className={`text-xs ${
                              mode === 'dark'
                                ? 'text-slate-400'
                                : 'text-slate-500'
                            }`}
                          >
                            Handle: {entity.handle}
                          </p>
                        )}
                        {entity.roles && entity.roles.length > 0 && (
                          <div className='mt-2'>
                            <p
                              className={`mb-1 text-xs font-medium ${
                                mode === 'dark'
                                  ? 'text-slate-400'
                                  : 'text-slate-600'
                              }`}
                            >
                              Roles:
                            </p>
                            <div className='flex flex-wrap gap-1'>
                              {entity.roles.map((role) => (
                                <span
                                  key={role}
                                  className={`rounded px-2 py-0.5 text-xs ${
                                    mode === 'dark'
                                      ? 'bg-indigo-900/40 text-indigo-300'
                                      : 'bg-indigo-100 text-indigo-700'
                                  }`}
                                >
                                  {role}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {entity.email && (
                          <p
                            className={`mt-2 text-xs ${
                              mode === 'dark'
                                ? 'text-slate-400'
                                : 'text-slate-600'
                            }`}
                          >
                            Email:{' '}
                            <a
                              href={`mailto:${entity.email}`}
                              className={`hover:underline ${
                                mode === 'dark'
                                  ? 'text-indigo-400'
                                  : 'text-indigo-600'
                              }`}
                            >
                              {entity.email}
                            </a>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* IP Remarks Section */}
            {ipResults.remarks && ipResults.remarks.length > 0 && (
              <section>
                <div
                  className={`rounded-lg p-5 shadow-md transition-colors duration-300 ${
                    mode === 'dark'
                      ? 'bg-gray-750 border border-gray-700'
                      : 'border border-indigo-100 bg-white'
                  }`}
                >
                  <div className='mb-4 flex items-center'>
                    <div
                      className={`mr-2 rounded-md p-1.5 ${
                        mode === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
                      }`}
                    >
                      <MessageSquare
                        className={`h-5 w-5 ${mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}
                      />
                    </div>
                    <h3
                      className={`text-lg font-bold transition-colors duration-300 ${
                        mode === 'dark' ? 'text-white' : 'text-indigo-900'
                      }`}
                    >
                      Remarks
                    </h3>
                  </div>
                  <div className='space-y-3'>
                    {ipResults.remarks.map((remark, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg p-3 ${
                          mode === 'dark'
                            ? 'border border-gray-600/50 bg-gray-800/50'
                            : 'border border-indigo-100 bg-indigo-50/50'
                        }`}
                      >
                        {remark.title && (
                          <p
                            className={`mb-1 font-medium ${
                              mode === 'dark'
                                ? 'text-indigo-300'
                                : 'text-indigo-700'
                            }`}
                          >
                            {remark.title}
                          </p>
                        )}
                        {remark.description &&
                          remark.description.length > 0 && (
                            <div
                              className={`text-sm ${
                                mode === 'dark'
                                  ? 'text-slate-300'
                                  : 'text-slate-700'
                              }`}
                            >
                              {remark.description.map((desc, descIdx) => (
                                <p key={descIdx} className='mb-1 last:mb-0'>
                                  {desc}
                                </p>
                              ))}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* Raw RDAP link */}
            <div className='pt-1 text-center'>
              <a
                href={getRdapIpUrl(ipResults.rdapServer, ipResults.ip)}
                target='_blank'
                rel='noopener noreferrer'
                className={`inline-flex items-center gap-1 text-xs hover:underline ${
                  mode === 'dark'
                    ? 'text-indigo-300 hover:text-indigo-200'
                    : 'text-indigo-600 hover:text-indigo-800'
                }`}
              >
                <FileText className='h-3.5 w-3.5' />
                RAW JSON
              </a>
            </div>
          </div>
        )}

        {/* ASN Results Display */}
        {asnResults && (
          <div
            className={`w-full space-y-6 rounded-xl border p-6 transition-colors duration-300 ${
              mode === 'dark'
                ? 'to-gray-750 border-gray-700 bg-gradient-to-br from-gray-800'
                : 'border-indigo-100 bg-white'
            }`}
          >
            {/* ASN Server Info Banner */}
            <div
              className={`mb-6 w-full rounded-lg p-3 text-center transition-colors duration-300 ${
                mode === 'dark'
                  ? 'border border-indigo-800 bg-indigo-900/20 text-indigo-200'
                  : 'border border-indigo-100 bg-indigo-50 text-indigo-700'
              }`}
            >
              <p className='text-sm'>
                ASN information retrieved from{' '}
                <a
                  href={`${asnResults.rdapServer}autnum/${asnResults.asn}`}
                  target='_blank'
                  rel='noopener noreferrer'
                  className={`font-medium hover:underline ${
                    mode === 'dark' ? 'text-indigo-300' : 'text-indigo-600'
                  }`}
                >
                  {new URL(asnResults.rdapServer).hostname}
                </a>
              </p>
            </div>

            <section className='space-y-5'>
              {/* ASN Details Card */}
              <div
                className={`rounded-lg p-5 shadow-md transition-colors duration-300 ${
                  mode === 'dark'
                    ? 'bg-gray-750 border border-gray-700'
                    : 'border border-indigo-100 bg-white'
                }`}
              >
                <div className='mb-3 flex items-center'>
                  <div
                    className={`mr-2 rounded-md p-1.5 ${
                      mode === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
                    }`}
                  >
                    <Activity
                      className={`h-5 w-5 ${mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}
                    />
                  </div>
                  <h3
                    className={`text-lg font-bold transition-colors duration-300 ${
                      mode === 'dark' ? 'text-white' : 'text-indigo-900'
                    }`}
                  >
                    AS{asnResults.asn}
                  </h3>
                </div>
                <dl className='grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2'>
                  <dt
                    className={`font-medium transition-colors duration-300 ${
                      mode === 'dark' ? 'text-indigo-200' : 'text-indigo-600'
                    }`}
                  >
                    ASN Range
                  </dt>
                  <dd
                    className={`transition-colors duration-300 ${
                      mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    AS{asnResults.range.start} - AS{asnResults.range.end}
                  </dd>
                  {asnResults.name && (
                    <>
                      <dt
                        className={`font-medium transition-colors duration-300 ${
                          mode === 'dark'
                            ? 'text-indigo-200'
                            : 'text-indigo-600'
                        }`}
                      >
                        Network Name
                      </dt>
                      <dd
                        className={`transition-colors duration-300 ${
                          mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                        }`}
                      >
                        {asnResults.name}
                      </dd>
                    </>
                  )}
                  {asnResults.organization && (
                    <>
                      <dt
                        className={`font-medium transition-colors duration-300 ${
                          mode === 'dark'
                            ? 'text-indigo-200'
                            : 'text-indigo-600'
                        }`}
                      >
                        Organization
                      </dt>
                      <dd
                        className={`transition-colors duration-300 ${
                          mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                        }`}
                      >
                        {asnResults.organization}
                      </dd>
                    </>
                  )}
                  {asnResults.country && (
                    <>
                      <dt
                        className={`font-medium transition-colors duration-300 ${
                          mode === 'dark'
                            ? 'text-indigo-200'
                            : 'text-indigo-600'
                        }`}
                      >
                        Country
                      </dt>
                      <dd
                        className={`transition-colors duration-300 ${
                          mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                        }`}
                      >
                        {asnResults.country.toUpperCase()}
                      </dd>
                    </>
                  )}
                  {asnResults.status && asnResults.status.length > 0 && (
                    <>
                      <dt
                        className={`font-medium transition-colors duration-300 ${
                          mode === 'dark'
                            ? 'text-indigo-200'
                            : 'text-indigo-600'
                        }`}
                      >
                        Status
                      </dt>
                      <dd
                        className={`transition-colors duration-300 ${
                          mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                        }`}
                      >
                        {asnResults.status.map((s) => (
                          <span
                            key={s}
                            className={`mr-2 inline-block rounded px-2 py-1 text-xs ${
                              mode === 'dark'
                                ? 'bg-green-900/30 text-green-300'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {s}
                          </span>
                        ))}
                      </dd>
                    </>
                  )}
                </dl>
              </div>

              {/* ASN Registration Dates */}
              {(asnResults.registrationDate || asnResults.lastChanged) && (
                <div
                  className={`rounded-lg p-5 shadow-md transition-colors duration-300 ${
                    mode === 'dark'
                      ? 'bg-gray-750 border border-gray-700'
                      : 'border border-indigo-100 bg-white'
                  }`}
                >
                  <div className='mb-3 flex items-center'>
                    <div
                      className={`mr-2 rounded-md p-1.5 ${
                        mode === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
                      }`}
                    >
                      <Clock
                        className={`h-5 w-5 ${mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}
                      />
                    </div>
                    <h3
                      className={`text-lg font-bold transition-colors duration-300 ${
                        mode === 'dark' ? 'text-white' : 'text-indigo-900'
                      }`}
                    >
                      Registration
                    </h3>
                  </div>
                  <dl className='grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2'>
                    {asnResults.registrationDate && (
                      <>
                        <dt
                          className={`font-medium transition-colors duration-300 ${
                            mode === 'dark'
                              ? 'text-indigo-200'
                              : 'text-indigo-600'
                          }`}
                        >
                          Registered On
                        </dt>
                        <dd
                          className={`transition-colors duration-300 ${
                            mode === 'dark'
                              ? 'text-slate-200'
                              : 'text-slate-900'
                          }`}
                        >
                          {asnResults.registrationDate}
                        </dd>
                      </>
                    )}
                    {asnResults.lastChanged && (
                      <>
                        <dt
                          className={`font-medium transition-colors duration-300 ${
                            mode === 'dark'
                              ? 'text-indigo-200'
                              : 'text-indigo-600'
                          }`}
                        >
                          Last Changed
                        </dt>
                        <dd
                          className={`transition-colors duration-300 ${
                            mode === 'dark'
                              ? 'text-slate-200'
                              : 'text-slate-900'
                          }`}
                        >
                          {asnResults.lastChanged}
                        </dd>
                      </>
                    )}
                  </dl>
                </div>
              )}

              {/* ASN Remarks */}
              {asnResults.remarks && asnResults.remarks.length > 0 && (
                <div
                  className={`rounded-lg p-5 shadow-md transition-colors duration-300 ${
                    mode === 'dark'
                      ? 'bg-gray-750 border border-gray-700'
                      : 'border border-indigo-100 bg-white'
                  }`}
                >
                  <h3
                    className={`mb-3 text-lg font-bold transition-colors duration-300 ${
                      mode === 'dark' ? 'text-white' : 'text-indigo-900'
                    }`}
                  >
                    Remarks
                  </h3>
                  {asnResults.remarks.map((remark, idx) => (
                    <div key={idx} className='mb-3 last:mb-0'>
                      {remark.title && (
                        <h4
                          className={`mb-1 font-semibold ${
                            mode === 'dark'
                              ? 'text-indigo-200'
                              : 'text-indigo-600'
                          }`}
                        >
                          {remark.title}
                        </h4>
                      )}
                      {remark.description &&
                        remark.description.map((desc, didx) => (
                          <p
                            key={didx}
                            className={`text-sm ${
                              mode === 'dark'
                                ? 'text-slate-200'
                                : 'text-slate-900'
                            }`}
                          >
                            {desc}
                          </p>
                        ))}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Raw RDAP link */}
            <div className='pt-1 text-center'>
              <a
                href={`${asnResults.rdapServer}autnum/${asnResults.asn}`}
                target='_blank'
                rel='noopener noreferrer'
                className={`inline-flex items-center gap-1 text-xs hover:underline ${
                  mode === 'dark'
                    ? 'text-indigo-300 hover:text-indigo-200'
                    : 'text-indigo-600 hover:text-indigo-800'
                }`}
              >
                <FileText className='h-3.5 w-3.5' />
                RAW JSON
              </a>
            </div>
          </div>
        )}

        {!domainResults &&
          !ipResults &&
          !asnResults &&
          status.type === 'error' && (
            <div
              className={`mt-4 w-full rounded-lg border p-4 text-center transition-colors duration-300 ${
                mode === 'dark'
                  ? 'border-red-700 bg-red-900/30 text-red-300'
                  : 'border-red-300 bg-red-100 text-red-700'
              }`}
            >
              <p>Could not fetch data. Details: {status.message}</p>
            </div>
          )}

        <footer
          className={`mt-8 text-center text-sm transition-colors duration-300 ${
            mode === 'dark' ? 'text-indigo-300' : 'text-indigo-600'
          }`}
        >
          <p className='flex items-center justify-center gap-1.5'>
            <Zap className='h-4 w-4' />
            Powered by IANA RDAP Data
          </p>
        </footer>
      </div>
    </main>
  );
}
