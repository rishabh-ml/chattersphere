import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to add caching headers for static assets
 * This helps improve loading speed for static assets
 */
export function addCachingHeaders(req: NextRequest) {
  const url = req.nextUrl.clone();
  const response = NextResponse.next();

  // Check if the request is for a static asset
  const isStaticAsset = /\.(jpe?g|png|gif|svg|webp|avif|css|js|woff2?|ttf|otf|eot)$/i.test(url.pathname);
  
  if (isStaticAsset) {
    // Set caching headers for static assets
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // Add caching headers for API responses that can be cached
  if (url.pathname.startsWith('/api/communities') && req.method === 'GET') {
    // Cache community data for 5 minutes
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300, stale-while-revalidate=60');
  }

  return response;
}
