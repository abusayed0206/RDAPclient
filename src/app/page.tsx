'use client';

import { useState, useEffect } from 'react';
import { NormalizedRdapData } from '@/lib/rdap';

export default function Home() {
  const [domain, setDomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: 'info' });
  const [results, setResults] = useState<NormalizedRdapData | null>(null);

  useEffect(() => {
    setStatus({ message: 'Ready to look up domains.', type: 'success' });
  }, []);

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
      case 'success': return 'text-green-600';
      case 'warn': return 'text-amber-600';
      case 'error': return 'text-red-600';
      default: return 'text-slate-500';
    }
  };

  return (
    <main className="bg-slate-100 text-slate-800 flex flex-col items-center min-h-screen p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-6 md:p-8">
        <header className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900">RDAP Lookup</h1>
          <p className="text-slate-500 mt-2">A simple, modern tool for domain information.</p>
        </header>

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g., google.com"
            className="flex-grow px-4 py-3 text-lg bg-slate-50 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 shadow-md disabled:bg-indigo-400"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Lookup'
            )}
          </button>
        </form>

        {status.message && (
          <p className={`text-center mb-4 font-medium ${getStatusColor(status.type)}`}>
            {status.message}
          </p>
        )}

        {results && (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h3 className="font-bold text-lg text-slate-800">Domain Details</h3>
                <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="font-medium text-slate-500">Domain Name</dt>
                  <dd className="text-slate-900 font-mono">{results.domainName}</dd>
                  <dt className="font-medium text-slate-500">Registrar</dt>
                  <dd className="text-slate-900">{results.registrar}</dd>
                  <dt className="font-medium text-slate-500">DNSSEC</dt>
                  <dd className={`font-semibold ${results.dnssec === 'Signed' ? 'text-green-600' : 'text-amber-600'}`}>
                    {results.dnssec}
                  </dd>
                </dl>
              </div>

              <div className="p-4 bg-white rounded-lg shadow-sm">
                <h3 className="font-bold text-lg text-slate-800">Important Dates</h3>
                <dl className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="font-medium text-slate-500">Registered On</dt>
                  <dd className="text-slate-900">{results.registeredOn}</dd>
                  <dt className="font-medium text-slate-500">Expires On</dt>
                  <dd className="text-slate-900">{results.expiresOn}</dd>
                  <dt className="font-medium text-slate-500">Last Updated</dt>
                  <dd className="text-slate-900">{results.lastUpdated}</dd>
                </dl>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <h3 className="font-bold text-lg text-slate-800">Domain Status</h3>
                  <ul className="mt-2 list-disc list-inside text-sm text-slate-900 space-y-1">
                    {results.statuses.map((s, i) => (
                      <li key={i}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">
                          {s.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-white rounded-lg shadow-sm">
                  <h3 className="font-bold text-lg text-slate-800">Nameservers</h3>
                  <ul className="mt-2 list-disc list-inside text-sm text-slate-900 space-y-1 font-mono">
                    {results.nameservers.map((ns, i) => <li key={i}>{ns}</li>)}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {!results && status.type === 'error' && (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-red-600">Could not fetch data. Details: {status.message}</p>
          </div>
        )}
      </div>

      <footer className="text-center mt-6 text-slate-500 text-sm">
        <p>Powered by IANA RDAP Data. API-driven architecture.</p>
      </footer>
    </main>
  );
}
