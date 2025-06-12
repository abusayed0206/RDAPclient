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
      setStatus({ message: `Data for ${domainName} loaded.`, type: 'success' });
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

  return (
    <main className={`min-h-screen transition-colors duration-300 flex items-center justify-center px-4 py-8 ${
      mode === 'dark' ? 'bg-gray-900' : 'bg-slate-100'
    }`}>
      <div className={`w-full max-w-4xl rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center transition-colors duration-300 ${
        mode === 'dark' ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="absolute top-4 right-4">
          <IconButton
            icon={mode === 'dark' ? Sun : Moon}
            variant={mode === 'dark' ? 'ghost' : 'ghost'}
            onClick={toggleMode}
            isDarkBg={mode === 'dark'}
            aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
            className={mode === 'dark' ? 'text-yellow-300' : 'text-slate-700'}
          />
        </div>

        <header className="text-center mb-8">
          <h1 className={`text-3xl md:text-4xl font-bold transition-colors duration-300 ${
            mode === 'dark' ? 'text-white' : 'text-slate-900'
          }`}>RDAP Lookup</h1>
          <p className={`mt-2 transition-colors duration-300 ${
            mode === 'dark' ? 'text-slate-300' : 'text-slate-500'
          }`}>A simple, modern tool for domain information.</p>
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
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500' 
                  : 'bg-slate-50 border-slate-200 focus:ring-primary-500'
              }`}
            />
          </div>
          <Button 
            type="submit"
            disabled={isLoading}
            variant="primary"
            className="w-full sm:w-auto"
            leftIcon={isLoading ? undefined : Search}
          >
            {isLoading ? (
              <div className="w-6 h-6 border-4 border-t-transparent rounded-full animate-spin mx-auto" />
            ) : (
              'Lookup'
            )}
          </Button>
        </form>

        {status.message && (
          <p className={`text-center mb-4 font-medium ${getStatusColor(status.type)}`}>
            {status.message}
          </p>
        )}

        {results && (
          <div className={`w-full p-6 rounded-xl border transition-colors duration-300 space-y-6 ${
            mode === 'dark' 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <section className="space-y-4">
              <div className={`p-5 rounded-lg shadow-sm transition-colors duration-300 ${
                mode === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}>
                <h3 className={`text-lg font-bold mb-3 transition-colors duration-300 ${
                  mode === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>Domain Details</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <dt className={`font-medium transition-colors duration-300 ${
                    mode === 'dark' ? 'text-slate-300' : 'text-slate-500'
                  }`}>Domain Name</dt>
                  <dd className={`font-mono transition-colors duration-300 ${
                    mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                  }`}>{results.domainName}</dd>
                  <dt className={`font-medium transition-colors duration-300 ${
                    mode === 'dark' ? 'text-slate-300' : 'text-slate-500'
                  }`}>Registrar</dt>
                  <dd className={`transition-colors duration-300 ${
                    mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                  }`}>{results.registrar}</dd>
                  <dt className={`font-medium transition-colors duration-300 ${
                    mode === 'dark' ? 'text-slate-300' : 'text-slate-500'
                  }`}>DNSSEC</dt>
                  <dd className={`font-semibold ${results.dnssec === 'Signed' ? 'text-green-500' : 'text-amber-500'}`}>
                    {results.dnssec}
                  </dd>
                </dl>
              </div>

              <div className={`p-5 rounded-lg shadow-sm transition-colors duration-300 ${
                mode === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}>
                <h3 className={`text-lg font-bold mb-3 transition-colors duration-300 ${
                  mode === 'dark' ? 'text-white' : 'text-slate-800'
                }`}>Important Dates</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <dt className={`font-medium transition-colors duration-300 ${
                    mode === 'dark' ? 'text-slate-300' : 'text-slate-500'
                  }`}>Registered On</dt>
                  <dd className={`transition-colors duration-300 ${
                    mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                  }`}>{results.registeredOn}</dd>
                  <dt className={`font-medium transition-colors duration-300 ${
                    mode === 'dark' ? 'text-slate-300' : 'text-slate-500'
                  }`}>Expires On</dt>
                  <dd className={`transition-colors duration-300 ${
                    mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                  }`}>{results.expiresOn}</dd>
                  <dt className={`font-medium transition-colors duration-300 ${
                    mode === 'dark' ? 'text-slate-300' : 'text-slate-500'
                  }`}>Last Updated</dt>
                  <dd className={`transition-colors duration-300 ${
                    mode === 'dark' ? 'text-slate-200' : 'text-slate-900'
                  }`}>{results.lastUpdated}</dd>
                </dl>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-5 rounded-lg shadow-sm transition-colors duration-300 ${
                  mode === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <h3 className={`text-lg font-bold mb-3 transition-colors duration-300 ${
                    mode === 'dark' ? 'text-white' : 'text-slate-800'
                  }`}>Domain Status</h3>
                  <ul className="list-disc list-inside text-sm space-y-2">
                    {results.statuses.map((s, i) => (
                      <li key={i} className={mode === 'dark' ? 'text-slate-200' : 'text-slate-900'}>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-500 hover:text-primary-600 hover:underline"
                        >
                          {s.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`p-5 rounded-lg shadow-sm transition-colors duration-300 ${
                  mode === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <h3 className={`text-lg font-bold mb-3 transition-colors duration-300 ${
                    mode === 'dark' ? 'text-white' : 'text-slate-800'
                  }`}>Nameservers</h3>
                  <ul className="list-disc list-inside text-sm space-y-2 font-mono">
                    {results.nameservers.map((ns, i) => (
                      <li key={i} className={mode === 'dark' ? 'text-slate-200' : 'text-slate-900'}>
                        {ns}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
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
          mode === 'dark' ? 'text-slate-400' : 'text-slate-500'
        }`}>
          <p>Powered by IANA RDAP Data. API-driven architecture.</p>
        </footer>
      </div>
    </main>
  );
}
