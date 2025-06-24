'use client';

import {
  Building,
  Clock,
  FileText,
  Globe,
  MapPin,
  Moon,
  Search,
  Server,
  ShieldCheck,
  Sun,
  Wifi,
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
  };
  rdapServer: string;
}

interface GeoData {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isp: string;
  organization: string;
  asn: string;
  dataSource: string;
  disclaimer: string;
}

type LookupType = 'domain' | 'ip';

export default function Home() {
  const [lookupType, setLookupType] = useState<LookupType>('domain');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: 'info' });
  const [domainResults, setDomainResults] = useState<NormalizedRdapData | null>(
    null,
  );
  const [ipResults, setIpResults] = useState<IPData | null>(null);
  const [geoResults, setGeoResults] = useState<GeoData | null>(null);
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
      message: 'Ready to look up domains and IP addresses.',
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
    setGeoResults(null);
    setStatus({
      message: `Ready to look up ${lookupType === 'domain' ? 'domains' : 'IP addresses'}.`,
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
    } else {
      if (!isValidIP(rawInput)) {
        setStatus({
          message: 'Please enter a valid IP address.',
          type: 'warn',
        });
        return;
      }
      await lookupIP(rawInput);
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

  const fetchGeolocation = async () => {
    if (!ipResults) return;

    setIsGeoLoading(true);
    try {
      const response = await fetch(`/api/geo/${ipResults.ip}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Geolocation API error.');
      setGeoResults(data);
    } catch (error: unknown) {
      // eslint-disable-next-line no-console
      console.error('Geolocation lookup failed:', error);
      setStatus({
        message: (error as Error).message || 'Geolocation lookup failed.',
        type: 'error',
      });
    } finally {
      setIsGeoLoading(false);
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
        <div className='absolute right-4 top-4'>
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

        <header className='mb-8 text-center'>
          <div
            className={`mb-4 inline-block rounded-full p-2 ${
              mode === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
            }`}
          >
            <Search
              className={`h-8 w-8 ${mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}
            />
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
            A simple, modern tool for domain and IP information
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
                lookupType === 'domain' ? 'e.g., google.com' : 'e.g., 8.8.8.8'
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
                    {domainResults.registrar}
                  </dd>
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
                  View raw RDAP data
                </a>
              </div>
            )}
          </div>
        )}

        <div className='mt-3'>
          <button
            onClick={fetchGeolocation}
            disabled={isGeoLoading}
            className={`
                  mx-auto flex items-center justify-center gap-2
                  rounded-md px-4 py-2 text-sm font-medium
                  transition-colors duration-300
                  ${
                    isGeoLoading
                      ? 'cursor-not-allowed bg-indigo-400'
                      : mode === 'dark'
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }
                `}
          >
            {isGeoLoading ? (
              <div className='h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent' />
            ) : (
              <>
                <MapPin className='h-4 w-4' />
                <span>Get Location Data</span>
              </>
            )}
          </button>
        </div>

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
                View raw RDAP data
              </a>
            </div>
          </div>
        )}

        {/* Geolocation Results Display */}
        {geoResults && (
          <div
            className={`mt-6 w-full space-y-4 rounded-xl border p-6 transition-colors duration-300 ${
              mode === 'dark'
                ? 'border-amber-700/50 bg-gradient-to-br from-amber-900/20 to-orange-900/20'
                : 'border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50'
            }`}
          >
            {/* Disclaimer */}
            <div
              className={`rounded-lg border p-3 transition-colors duration-300 ${
                mode === 'dark'
                  ? 'border-amber-700 bg-amber-900/30 text-amber-200'
                  : 'border-amber-300 bg-amber-100 text-amber-800'
              }`}
            >
              <p className='text-sm'>
                <strong>Disclaimer:</strong> {geoResults.disclaimer}
              </p>
            </div>

            <section className='space-y-5'>
              {/* Location Details Card */}
              <div
                className={`rounded-lg p-5 shadow-md transition-colors duration-300 ${
                  mode === 'dark'
                    ? 'bg-gray-750 border border-gray-700'
                    : 'border border-amber-200 bg-white'
                }`}
              >
                <div className='mb-3 flex items-center'>
                  <div
                    className={`mr-2 rounded-md p-1.5 ${
                      mode === 'dark' ? 'bg-amber-900/30' : 'bg-amber-100'
                    }`}
                  >
                    <MapPin
                      className={`h-5 w-5 ${mode === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}
                    />
                  </div>
                  <h3
                    className={`text-lg font-bold transition-colors duration-300 ${
                      mode === 'dark' ? 'text-white' : 'text-amber-900'
                    }`}
                  >
                    Location Information
                  </h3>
                </div>
                <dl className='grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2'>
                  <dt
                    className={`font-medium transition-colors duration-300 ${
                      mode === 'dark' ? 'text-amber-200' : 'text-amber-700'
                    }`}
                  >
                    Country
                  </dt>
                  <dd
                    className={`transition-colors duration-300 ${
                      mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    {geoResults.country} ({geoResults.countryCode})
                  </dd>
                  <dt
                    className={`font-medium transition-colors duration-300 ${
                      mode === 'dark' ? 'text-amber-200' : 'text-amber-700'
                    }`}
                  >
                    Region
                  </dt>
                  <dd
                    className={`transition-colors duration-300 ${
                      mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    {geoResults.region}
                  </dd>
                  <dt
                    className={`font-medium transition-colors duration-300 ${
                      mode === 'dark' ? 'text-amber-200' : 'text-amber-700'
                    }`}
                  >
                    City
                  </dt>
                  <dd
                    className={`transition-colors duration-300 ${
                      mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    {geoResults.city}
                  </dd>
                  <dt
                    className={`font-medium transition-colors duration-300 ${
                      mode === 'dark' ? 'text-amber-200' : 'text-amber-700'
                    }`}
                  >
                    Zip Code
                  </dt>
                  <dd
                    className={`transition-colors duration-300 ${
                      mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    {geoResults.zipCode || 'N/A'}
                  </dd>
                  <dt
                    className={`font-medium transition-colors duration-300 ${
                      mode === 'dark' ? 'text-amber-200' : 'text-amber-700'
                    }`}
                  >
                    Coordinates
                  </dt>
                  <dd
                    className={`font-mono transition-colors duration-300 ${
                      mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    {geoResults.latitude}, {geoResults.longitude}
                  </dd>
                  <dt
                    className={`font-medium transition-colors duration-300 ${
                      mode === 'dark' ? 'text-amber-200' : 'text-amber-700'
                    }`}
                  >
                    Timezone
                  </dt>
                  <dd
                    className={`transition-colors duration-300 ${
                      mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    {geoResults.timezone}
                  </dd>
                </dl>
              </div>

              {/* ISP Details Card */}
              <div
                className={`rounded-lg p-5 shadow-md transition-colors duration-300 ${
                  mode === 'dark'
                    ? 'bg-gray-750 border border-gray-700'
                    : 'border border-amber-200 bg-white'
                }`}
              >
                <div className='mb-3 flex items-center'>
                  <div
                    className={`mr-2 rounded-md p-1.5 ${
                      mode === 'dark' ? 'bg-amber-900/30' : 'bg-amber-100'
                    }`}
                  >
                    <Wifi
                      className={`h-5 w-5 ${mode === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}
                    />
                  </div>
                  <h3
                    className={`text-lg font-bold transition-colors duration-300 ${
                      mode === 'dark' ? 'text-white' : 'text-amber-900'
                    }`}
                  >
                    ISP Information
                  </h3>
                </div>
                <dl className='grid grid-cols-1 gap-x-4 gap-y-3 text-sm'>
                  <dt
                    className={`font-medium transition-colors duration-300 ${
                      mode === 'dark' ? 'text-amber-200' : 'text-amber-700'
                    }`}
                  >
                    Internet Service Provider
                  </dt>
                  <dd
                    className={`transition-colors duration-300 ${
                      mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    {geoResults.isp}
                  </dd>
                  <dt
                    className={`font-medium transition-colors duration-300 ${
                      mode === 'dark' ? 'text-amber-200' : 'text-amber-700'
                    }`}
                  >
                    Organization
                  </dt>
                  <dd
                    className={`transition-colors duration-300 ${
                      mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    {geoResults.organization}
                  </dd>
                  <dt
                    className={`font-medium transition-colors duration-300 ${
                      mode === 'dark' ? 'text-amber-200' : 'text-amber-700'
                    }`}
                  >
                    ASN
                  </dt>
                  <dd
                    className={`font-mono transition-colors duration-300 ${
                      mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                    }`}
                  >
                    {geoResults.asn}
                  </dd>
                </dl>
              </div>
            </section>

            {/* Data Source */}
            <div className='pt-1 text-center'>
              <p
                className={`text-xs ${
                  mode === 'dark' ? 'text-amber-300' : 'text-amber-700'
                }`}
              >
                <Building className='mr-1 inline h-3.5 w-3.5' />
                Geolocation data provided by {geoResults.dataSource}
              </p>
            </div>
          </div>
        )}

        {!domainResults && !ipResults && status.type === 'error' && (
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
