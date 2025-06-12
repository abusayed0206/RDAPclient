// src/app/api/lookup/[domain]/route.ts
import { NextResponse } from 'next/server';
import { 
    fetchAndCacheServers, 
    findRdapServerUrl,
    normalizeRdapResponse,
    RdapResponse
} from '@/lib/rdap';

export async function GET(
  request: Request,
  { params }: { params: { domain: string } }
) {
  const domainName = params.domain;

  if (!domainName) {
    return NextResponse.json({ error: 'Domain name is required.' }, { status: 400 });
  }

  // Basic validation for domain format
  const tldMatch = domainName.match(/\.([^.]+)$/);
  if (!tldMatch) {
    return NextResponse.json({ error: `'${domainName}' is not a valid domain format.` }, { status: 400 });
  }
  const tld = tldMatch[1];

  try {
    // This function will fetch from IANA only if the server-side cache is empty.
    await fetchAndCacheServers();

    // Find the correct RDAP server for the TLD
    const rdapServerUrl = findRdapServerUrl(tld);
    if (!rdapServerUrl) {
      return NextResponse.json({ error: `No RDAP server found for the '.${tld}' TLD.` }, { status: 404 });
    }

    // Construct the full query URL and fetch data from the authoritative RDAP server
    const baseUrl = rdapServerUrl.endsWith('/') ? rdapServerUrl : `${rdapServerUrl}/`;
    const fullQueryUrl = `${baseUrl}domain/${domainName}`;
    
    const response = await fetch(fullQueryUrl);

    if (!response.ok) {
        let errorBody = 'The RDAP server returned an error.';
        try {
            // Try to parse the error response from the RDAP server
            const errorJson = await response.json();
            errorBody = errorJson.description || errorJson.title || JSON.stringify(errorJson);
        } catch (e) {
            // Fallback if the error response is not JSON
            errorBody = `HTTP Error ${response.status}: ${response.statusText}`;
        }
        return NextResponse.json({ error: errorBody }, { status: response.status });
    }

    const rawData: RdapResponse = await response.json();
    
    // Process the raw data into a clean, normalized format
    const normalizedData = normalizeRdapResponse(rawData,baseUrl);

    return NextResponse.json(normalizedData);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown internal error occurred';
    console.error(`API Lookup Error for ${domainName}:`, error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
