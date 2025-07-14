// src/app/api/rdap/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rdapUrl = searchParams.get('url');

  if (!rdapUrl) {
    return NextResponse.json(
      { error: 'Missing RDAP URL parameter' },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(rdapUrl);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(errorData, {
        status: response.status,
        statusText: response.statusText,
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch from RDAP server' },
      { status: 500 },
    );
  }
}
