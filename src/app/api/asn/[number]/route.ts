import { NextResponse } from 'next/server';

import { lookupASN } from '@/lib/asn-rdap';

export async function GET(
  request: Request,
  { params }: { params: { number: string } },
) {
  try {
    const asnNumber = params.number;

    if (!asnNumber) {
      return NextResponse.json(
        { error: 'ASN number required' },
        { status: 400 },
      );
    }

    const data = await lookupASN(asnNumber);

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
