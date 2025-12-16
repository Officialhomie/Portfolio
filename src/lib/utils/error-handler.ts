/**
 * Error Handler Utilities
 * Handles browser extension compatibility issues and API errors gracefully
 */

/**
 * Suppress errors from browser extensions that interfere with fetch
 * This is a known issue with some wallet extensions (like Ambire) that
 * modify Response objects and break the clone() method
 */
export function suppressBrowserExtensionErrors() {
  if (typeof window === 'undefined') return;

  const originalError = console.error;
  const originalWarn = console.warn;

  // More aggressive error filtering - check all arguments, not just first
  const shouldSuppress = (...args: unknown[]): boolean => {
    const message = args.map(arg => String(arg)).join(' ');
    return (
      message.includes('resource.clone is not a function') ||
      message.includes('ambire-inpage.js') ||
      message.includes('ambire-inpage') ||
      (message.includes('TypeError') && message.includes('clone')) ||
      message.includes('FetchUtil.ts') ||
      (message.includes('ApiController') && message.includes('clone'))
    );
  };

  // Filter out known browser extension errors
  console.error = (...args: unknown[]) => {
    if (shouldSuppress(...args)) {
      // Silently ignore - this is a browser extension compatibility issue
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: unknown[]) => {
    if (shouldSuppress(...args)) {
      return;
    }
    originalWarn.apply(console, args);
  };

  // Patch Response.clone to handle browser extension issues
  let originalClone: typeof Response.prototype.clone | undefined;
  if (typeof Response !== 'undefined' && Response.prototype) {
    originalClone = Response.prototype.clone;
    Response.prototype.clone = function() {
      try {
        if (originalClone) {
          return originalClone.call(this);
        }
        // Fallback if originalClone is not available
        return new Response(this.body, {
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
        });
      } catch (error) {
        // If clone fails, return a new Response with the same data
        // This is a workaround for browser extensions that break clone()
        if (error instanceof Error && error.message.includes('clone')) {
          return new Response(this.body, {
            status: this.status,
            statusText: this.statusText,
            headers: this.headers,
          });
        }
        throw error;
      }
    };
  }

  // Restore original handlers on cleanup
  return () => {
    console.error = originalError;
    console.warn = originalWarn;
    if (typeof Response !== 'undefined' && Response.prototype && originalClone) {
      Response.prototype.clone = originalClone;
    }
  };
}

/**
 * Check if fetch Response supports clone method
 * Some browser extensions break the Response.clone() method
 */
export function isResponseCloneSupported(): boolean {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') {
    return false;
  }

  try {
    // Test if Response.clone works
    const testResponse = new Response('test');
    if (typeof testResponse.clone !== 'function') {
      return false;
    }
    testResponse.clone();
    return true;
  } catch {
    return false;
  }
}

