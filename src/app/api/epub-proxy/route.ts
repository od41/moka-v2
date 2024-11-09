import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const epubUrl = url.searchParams.get('url');

  if (!epubUrl) {
    return new NextResponse('URL parameter is required', { status: 400 });
  }

  const response = await fetch(epubUrl);
  const data = await response.arrayBuffer();

  return new NextResponse(data, {
    headers: {
      'Content-Type': 'application/epub+zip',
      'Access-Control-Allow-Origin': '*',
    },
  });
} 