'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { captureException } from '@/lib/sentry';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to Sentry
    captureException(error, { context: 'error-boundary' });
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by error boundary:', error);
    }
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <div className="space-y-6 max-w-md">
        <h1 className="text-4xl font-bold text-gray-900">Something went wrong</h1>
        <p className="text-gray-500">
          We're sorry, but we encountered an unexpected error. Our team has been notified.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="p-4 bg-red-50 rounded-md text-left">
            <p className="text-red-700 font-medium">Error: {error.message}</p>
            {error.stack && (
              <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-40">
                {error.stack}
              </pre>
            )}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button
            variant="outline"
            size="lg"
            className="flex items-center gap-2"
            onClick={() => reset()}
          >
            <RefreshCw size={16} />
            Try Again
          </Button>
          
          <Button
            variant="default"
            size="lg"
            className="flex items-center gap-2"
            asChild
          >
            <Link href="/">
              <Home size={16} />
              Home Page
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
