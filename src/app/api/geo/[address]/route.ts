import { NextResponse } from 'next/server';

interface IPAPIResponse {
  status: string;
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  zip: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
  org: string;
  as: string;
  query: string;
  message?: string;
}

interface NormalizedGeoData {
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

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  const ipAddress = params.address;

  if (!ipAddress) {
    return NextResponse.json({ error: 'IP address is required.' }, { status: 400 });
  }

  try {
    const response = await fetch(
      `http://ip-api.com/json/${ipAddress}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as,query`,
      {
        headers: {
          'User-Agent': 'RDAPclient/1.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data: IPAPIResponse = await response.json();

    if (data.status === 'fail') {
      throw new Error(data.message || 'Geolocation lookup failed');
    }

    const result: NormalizedGeoData = {
      ip: data.query,
      country: data.country,
      countryCode: data.countryCode,
      region: data.regionName,
      city: data.city,
      zipCode: data.zip,
      latitude: data.lat,
      longitude: data.lon,
      timezone: data.timezone,
      isp: data.isp,
      organization: data.org,
      asn: data.as,
      dataSource: 'ip-api.com',
      disclaimer: 'Geolocation data provided by ip-api.com. This data is not from RDAP servers and may not be 100% accurate.'
    };

    return NextResponse.json(result);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    // eslint-disable-next-line no-console
    console.error(`Geolocation lookup error for ${ipAddress}:`, error);
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
