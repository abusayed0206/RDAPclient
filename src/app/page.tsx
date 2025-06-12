'use client';

import { Moon, Search, Sun, Globe, Clock, ShieldCheck, Server, FileText, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { parse } from 'tldts'; 
import { NormalizedRdapData } from '@/lib/rdap';

export default function Home() {
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: 'info' });
  const [results, setResults] = useState<NormalizedRdapData | null>(null);
  const [mode, setMode] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode');
    if (savedMode && (savedMode === 'dark' || savedMode === 'light')) {
      setMode(savedMode);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(prefersDark ? 'dark' : 'light');
    }
    setStatus({ message: 'Ready to look up domains.', type: 'success' });
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const rawInput = domain.trim().toLowerCase();
    const parsed = parse(rawInput); 

    if (!parsed.domain) {
      setStatus({ message: 'Please enter a valid domain name.', type: 'warn' });
      return;
    }

    const domainName = parsed.domain;

    setIsLoading(true);
    setResults(null);
    setStatus({ message: `Looking up ${domainName}...`, type: 'info' });

    try {
      const response = await fetch(`/api/lookup/${domainName}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'API error.');
      setResults(data);
    } catch (error: any) {
      console.error('Lookup failed:', error);
      setStatus({ message: error.message || 'Unknown error.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case 'success': return mode === 'dark' ? 'text-green-400' : 'text-green-600';
      case 'warn': return mode === 'dark' ? 'text-amber-400' : 'text-amber-600';
      case 'error': return mode === 'dark' ? 'text-red-400' : 'text-red-600';
      default: return mode === 'dark' ? 'text-slate-400' : 'text-slate-500';
    }
  };

  const getRdapDomainUrl = (baseUrl: string, domainName: string): string => {
    const url = new URL(baseUrl);
    const basePath = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
    url.pathname = `${basePath}domain/${domainName}`;
    return url.toString();
  };

  return (
    <main className={`min-h-screen transition-colors duration-300 flex items-center justify-center px-4 py-8 ${
      mode === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <div className={`w-full max-w-4xl rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center transition-colors duration-300 ${
        mode === 'dark' 
          ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700' 
          : 'bg-white border border-indigo-100'
      }`}>
        <div className="absolute top-4 right-4">
          {/* Replaced IconButton with native button */}
          <button
            onClick={toggleMode}
            className={`
              inline-flex items-center justify-center p-2 rounded-full text-lg font-semibold
              transition-colors duration-300
              ${mode === 'dark' 
                ? 'text-yellow-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-800' 
                : 'text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-white'
              }
            `}
            aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
          >
            {mode === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>

        <header className="text-center mb-8">
          <div className={`inline-block p-2 rounded-full mb-4 ${
            mode === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
          }`}>
            <Search className={`w-8 h-8 ${mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
          </div>
          <h1 className={`text-3xl md:text-4xl font-bold transition-colors duration-300 ${
            mode === 'dark' ? 'text-white' : 'text-indigo-900'
          }`}>RDAP Lookup</h1>
          <p className={`mt-2 transition-colors duration-300 ${
            mode === 'dark' ? 'text-indigo-200' : 'text-indigo-600'
          }`}>A simple, modern tool for domain information</p>
        </header>

        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col sm:flex-row gap-4 mb-6"
        >
          <div className="flex-grow relative">
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="e.g., google.com"
              className={`w-full px-4 py-3 text-lg rounded-lg transition-colors duration-300 border-2 focus:outline-none focus:ring-2 ${
                mode === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500' 
                  : 'bg-white border-indigo-200 focus:ring-indigo-500 focus:border-indigo-500'
              }`}
            />
          </div>
          {/* Replaced Button with native button */}
          <button 
            type="submit"
            disabled={isLoading}
            className={`
              w-full sm:w-auto px-6 py-3 rounded-lg text-lg font-semibold
              flex items-center justify-center gap-2
              transition-colors duration-300 transform active:scale-95
              ${isLoading 
                ? 'bg-indigo-400 cursor-not-allowed' 
                : mode === 'dark' 
                  ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-700 text-white shadow-lg shadow-indigo-500/30' 
                  : 'bg-indigo-600 hover:bg-indigo-700 border-indigo-700 text-white shadow-lg shadow-indigo-500/30'
              }
            `}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-4 border-t-transparent rounded-full animate-spin border-white" />
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Lookup</span>
              </>
            )}
          </button>
        </form>

        {!results && status.message && status.type !== 'error' && (
          <p className={`text-center mb-4 font-medium ${getStatusColor(status.type)}`}>
            {status.message}
          </p>
        )}

        {results && results.rdapServer && (
          <div className={`w-full mb-6 p-3 rounded-lg text-center transition-colors duration-300 ${
            mode === 'dark' 
              ? 'bg-indigo-900/20 text-indigo-200 border border-indigo-800' 
              : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
          }`}>
            <p className="text-sm">
              Domain information retrieved from{' '}
              <a
                href={getRdapDomainUrl(results.rdapServer, results.domainName)}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-medium hover:underline ${
                  mode === 'dark' ? 'text-indigo-300' : 'text-indigo-600'
                }`}
              >
                {new URL(results.rdapServer).hostname}
              </a>
            </p>
          </div>
        )}

        {results && (
          <div className={`w-full p-6 rounded-xl border transition-colors duration-300 space-y-6 ${
            mode === 'dark' 
              ? 'bg-gradient-to-br from-gray-800 to-gray-750 border-gray-700' 
              : 'bg-white border-indigo-100'
          }`}>
            <section className="space-y-5">
              {/* Domain Details Card */}
              <div className={`p-5 rounded-lg shadow-md transition-colors duration-300 ${
                mode === 'dark' ? 'bg-gray-750 border border-gray-700' : 'bg-white border border-indigo-100'
              }`}>
                <div className="flex items-center mb-3">
                  <div className={`p-1.5 rounded-md mr-2 ${
                    mode === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
                  }`}>
                    {/* Replaced SVG with Lucide icon */}
                    <Globe className={`w-5 h-5 ${mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  </div>
                  <h3 className={`text-lg font-bold transition-colors duration-300 ${
                    mode === 'dark' ? 'text-white' : 'text-indigo-900'
                  }`}>Domain Details</h3>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <dt className={`font-medium transition-colors duration-300 ${
                    mode === 'dark' ? 'text-indigo-200' : 'text-indigo-600'
                  }`}>Domain Name</dt>
                  <dd className={`font-mono transition-colors duration-300 ${
                    mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                  }`}>{results.domainName}</dd>
                  <dt className={`font-medium transition-colors duration-300 ${
                    mode === 'dark' ? 'text-indigo-200' : 'text-indigo-600'
                  }`}>Registrar</dt>
                  <dd className={`transition-colors duration-300 ${
                    mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                  }`}>{results.registrar}</dd>
                  <dt className={`font-medium transition-colors duration-300 ${
                    mode === 'dark' ? 'text-indigo-200' : 'text-indigo-600'
                  }`}>DNSSEC</dt>
                  <dd className={`font-semibold ${results.dnssec === 'Signed' ? 'text-green-500' : 'text-amber-500'}`}>
                    {results.dnssec}
                  </dd>
                </dl>
              </div>

              {/* Important Dates Card */}
              <div className={`p-5 rounded-lg shadow-md transition-colors duration-300 ${
                mode === 'dark' ? 'bg-gray-750 border border-gray-700' : 'bg-white border border-indigo-100'
              }`}>
                <div className="flex items-center mb-3">
                  <div className={`p-1.5 rounded-md mr-2 ${
                    mode === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
                  }`}>
                    {/* Replaced SVG with Lucide icon */}
                    <Clock className={`w-5 h-5 ${mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  </div>
                  <h3 className={`text-lg font-bold transition-colors duration-300 ${
                    mode === 'dark' ? 'text-white' : 'text-indigo-900'
                  }`}>Important Dates</h3>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <dt className={`font-medium transition-colors duration-300 ${
                    mode === 'dark' ? 'text-indigo-200' : 'text-indigo-600'
                  }`}>Registered On</dt>
                  <dd className={`transition-colors duration-300 ${
                    mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                  }`}>{results.registeredOn}</dd>
                  <dt className={`font-medium transition-colors duration-300 ${
                    mode === 'dark' ? 'text-indigo-200' : 'text-indigo-600'
                  }`}>Expires On</dt>
                  <dd className={`transition-colors duration-300 ${
                    mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                  }`}>{results.expiresOn}</dd>
                  <dt className={`font-medium transition-colors duration-300 ${
                    mode === 'dark' ? 'text-indigo-200' : 'text-indigo-600'
                  }`}>Last Updated</dt>
                  <dd className={`transition-colors duration-300 ${
                    mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                  }`}>{results.lastUpdated}</dd>
                </dl>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Domain Status Card */}
                <div className={`p-5 rounded-lg shadow-md transition-colors duration-300 ${
                  mode === 'dark' ? 'bg-gray-750 border border-gray-700' : 'bg-white border border-indigo-100'
                }`}>
                  <div className="flex items-center mb-3">
                    <div className={`p-1.5 rounded-md mr-2 ${
                      mode === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
                    }`}>
                      {/* Replaced SVG with Lucide icon */}
                      <ShieldCheck className={`w-5 h-5 ${mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    </div>
                    <h3 className={`text-lg font-bold transition-colors duration-300 ${
                      mode === 'dark' ? 'text-white' : 'text-indigo-900'
                    }`}>Domain Status</h3>
                  </div>
                  <ul className="list-none space-y-2.5">
                    {results.statuses.map((s, i) => (
                      <li key={i} className="flex items-start">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 mr-2 ${
                          mode === 'dark' ? 'bg-indigo-400' : 'bg-indigo-600'
                        }`}></span>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
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
                <div className={`p-5 rounded-lg shadow-md transition-colors duration-300 ${
                  mode === 'dark' ? 'bg-gray-750 border border-gray-700' : 'bg-white border border-indigo-100'
                }`}>
                  <div className="flex items-center mb-3">
                    <div className={`p-1.5 rounded-md mr-2 ${
                      mode === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
                    }`}>
                      {/* Replaced SVG with Lucide icon */}
                      <Server className={`w-5 h-5 ${mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
                    </div>
                    <h3 className={`text-lg font-bold transition-colors duration-300 ${
                      mode === 'dark' ? 'text-white' : 'text-indigo-900'
                    }`}>Nameservers</h3>
                  </div>
                  <ul className="list-none space-y-2.5">
                    {results.nameservers.map((ns, i) => (
                      <li key={i} className="flex items-start">
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 mr-2 ${
                          mode === 'dark' ? 'bg-indigo-400' : 'bg-indigo-600'
                        }`}></span>
                        <span className={`text-sm font-mono ${
                          mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                        }`}>
                          {ns}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
            
            {/* Raw RDAP link at the bottom of results */}
            {results.rdapServer && (
              <div className="text-center pt-1">
                <a
                  href={getRdapDomainUrl(results.rdapServer, results.domainName)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs inline-flex items-center gap-1 hover:underline ${
                    mode === 'dark' ? 'text-indigo-300 hover:text-indigo-200' : 'text-indigo-600 hover:text-indigo-800'
                  }`}
                >
                  {/* Replaced SVG with Lucide icon */}
                  <FileText className="h-3.5 w-3.5" />
                  View raw RDAP data
                </a>
              </div>
            )}
          </div>
        )}

        {!results && status.type === 'error' && (
          <div className={`w-full p-4 rounded-lg text-center mt-4 border transition-colors duration-300 ${
            mode === 'dark' 
              ? 'bg-red-900/30 border-red-700 text-red-300' 
              : 'bg-red-100 border-red-300 text-red-700'
          }`}>
            <p>Could not fetch data. Details: {status.message}</p>
          </div>
        )}

        <footer className={`text-center mt-8 text-sm transition-colors duration-300 ${
          mode === 'dark' ? 'text-indigo-300' : 'text-indigo-600'
        }`}>
          <p className="flex items-center justify-center gap-1.5">
            {/* Replaced SVG with Lucide icon */}
            <Zap className="h-4 w-4" />
            Powered by IANA RDAP Data
          </p>
        </footer>
      </div>
    </main>
  );
}
