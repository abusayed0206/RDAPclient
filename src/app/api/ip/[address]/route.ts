import { NextResponse } from 'next/server';

import { lookupIP } from '@/lib/ip-rdap';

export async function GET(
  request: Request,
  { params }: { params: { address: string } },
) {
  const ipAddress = params.address;

  if (!ipAddress) {
    return NextResponse.json(
      { error: 'IP address is required.' },
      { status: 400 },
    );
  }

  try {
    const result = await lookupIP(ipAddress);
    return NextResponse.json(result);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    // eslint-disable-next-line no-console
    console.error(`IP lookup error for ${ipAddress}:`, error);

    // Determine appropriate status code
    let statusCode = 500;
    if (
      errorMessage.includes('Invalid IP') ||
      errorMessage.includes('Private IP') ||
      errorMessage.includes('Reserved IP')
    ) {
      statusCode = 400;
    } else if (errorMessage.includes('No RDAP server found')) {
      statusCode = 404;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
