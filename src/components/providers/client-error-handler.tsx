'use client';

/**
 * Client Error Handler
 * Suppresses browser extension errors and handles client-side error suppression
 */

import { useEffect } from 'react';
import { suppressBrowserExtensionErrors } from '@/lib/utils/error-handler';

export function ClientErrorHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Suppress browser extension errors immediately on mount
    const cleanup = suppressBrowserExtensionErrors();
    
    // Also add global error handler for unhandled errors
    const handleError = (event: ErrorEvent) => {
      const message = event.message || event.error?.message || '';
      const filename = event.filename || '';
      
      // Suppress known browser extension errors
      if (
        message.includes('resource.clone is not a function') ||
        message.includes('ambire-inpage.js') ||
        message.includes('ambire-inpage') ||
        filename.includes('ambire-inpage') ||
        (message.includes('TypeError') && message.includes('clone')) ||
        message.includes('FetchUtil') ||
        (message.includes('ApiController') && message.includes('clone'))
      ) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    // Handle unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || String(event.reason) || '';
      
      if (
        message.includes('resource.clone is not a function') ||
        message.includes('ambire-inpage') ||
        (message.includes('TypeError') && message.includes('clone'))
      ) {
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      cleanup?.();
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return <>{children}</>;
}

