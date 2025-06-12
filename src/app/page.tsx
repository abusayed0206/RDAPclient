'use client';

import { Moon, Search, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

import Button from '@/components/buttons/Button';
import IconButton from '@/components/buttons/IconButton';
import { NormalizedRdapData } from '@/lib/rdap';

export default function Home() {
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: 'info' });
  const [results, setResults] = useState<NormalizedRdapData | null>(null);
  const [mode, setMode] = useState<'dark' | 'light'>('light');

  // Initialize theme from user preference or localStorage
  useEffect(() => {
    // Check for saved user preference
    const savedMode = localStorage.getItem('theme-mode');
    if (savedMode && (savedMode === 'dark' || savedMode === 'light')) {
      setMode(savedMode);
    } else {
      // Use system preference as fallback
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setMode(prefersDark ? 'dark' : 'light');
    }
    
    setStatus({ message: 'Ready to look up domains.', type: 'success' });
  }, []);

  // Apply theme class to document when mode changes
  useEffect(() => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save preference
    localStorage.setItem('theme-mode', mode);
  }, [mode]);

  // Toggle theme mode
  const toggleMode = () => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const domainName = domain.trim().toLowerCase();
    if (!domainName) {
      setStatus({ message: 'Please enter a domain name.', type: 'warn' });
      return;
    }

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

  // Function to get the direct RDAP domain URL
  const getRdapDomainUrl = (baseUrl: string, domainName: string): string => {
    const url = new URL(baseUrl);
    // Ensure the path ends with a slash before adding 'domain/'
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
          <IconButton
            icon={mode === 'dark' ? Sun : Moon}
            variant={mode === 'dark' ? 'ghost' : 'ghost'}
            onClick={toggleMode}
            isDarkBg={mode === 'dark'}
            aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
            className={mode === 'dark' ? 'text-yellow-300 hover:bg-gray-700' : 'text-indigo-600 hover:bg-indigo-50'}
          />
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
          <Button 
            type="submit"
            disabled={isLoading}
            variant="primary"
            className={`w-full sm:w-auto ${
              mode === 'dark' 
                ? 'bg-indigo-600 hover:bg-indigo-700 border-indigo-700' 
                : 'bg-indigo-600 hover:bg-indigo-700 border-indigo-700'
            }`}
            leftIcon={isLoading ? undefined : Search}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-4 border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              'Lookup'
            )}
          </Button>
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
              <div className={`p-5 rounded-lg shadow-md transition-colors duration-300 ${
                mode === 'dark' ? 'bg-gray-750 border border-gray-700' : 'bg-white border border-indigo-100'
              }`}>
                <div className="flex items-center mb-3">
                  <div className={`p-1.5 rounded-md mr-2 ${
                    mode === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                    </svg>
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

              <div className={`p-5 rounded-lg shadow-md transition-colors duration-300 ${
                mode === 'dark' ? 'bg-gray-750 border border-gray-700' : 'bg-white border border-indigo-100'
              }`}>
                <div className="flex items-center mb-3">
                  <div className={`p-1.5 rounded-md mr-2 ${
                    mode === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
                  }`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
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
                <div className={`p-5 rounded-lg shadow-md transition-colors duration-300 ${
                  mode === 'dark' ? 'bg-gray-750 border border-gray-700' : 'bg-white border border-indigo-100'
                }`}>
                  <div className="flex items-center mb-3">
                    <div className={`p-1.5 rounded-md mr-2 ${
                      mode === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
                    }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
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

                <div className={`p-5 rounded-lg shadow-md transition-colors duration-300 ${
                  mode === 'dark' ? 'bg-gray-750 border border-gray-700' : 'bg-white border border-indigo-100'
                }`}>
                  <div className="flex items-center mb-3">
                    <div className={`p-1.5 rounded-md mr-2 ${
                      mode === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-100'
                    }`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`w-5 h-5 ${mode === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
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
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
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
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Powered by IANA RDAP Data
          </p>
        </footer>
      </div>
    </main>
  );
}
