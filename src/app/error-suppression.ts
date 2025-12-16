/**
 * Error Suppression Script
 * Runs immediately to suppress browser extension errors before React loads
 * This must be imported early in the app lifecycle
 */

if (typeof window !== 'undefined') {
  // Suppress errors immediately, before React loads
  const originalError = console.error;
  const originalWarn = console.warn;

  const shouldSuppress = (message: string): boolean => {
    return (
      message.includes('resource.clone is not a function') ||
      message.includes('ambire-inpage.js') ||
      message.includes('ambire-inpage') ||
      (message.includes('TypeError') && message.includes('clone')) ||
      message.includes('FetchUtil.ts') ||
      (message.includes('ApiController') && message.includes('clone'))
    );
  };

  console.error = (...args: unknown[]) => {
    const message = args.map(arg => String(arg)).join(' ');
    if (shouldSuppress(message)) {
      return; // Silently suppress
    }
    originalError.apply(console, args);
  };

  console.warn = (...args: unknown[]) => {
    const message = args.map(arg => String(arg)).join(' ');
    if (shouldSuppress(message)) {
      return; // Silently suppress
    }
    originalWarn.apply(console, args);
  };

  // Global error handler
  window.addEventListener('error', (event) => {
    const message = event.message || event.error?.message || '';
    if (shouldSuppress(message)) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true); // Use capture phase to catch early

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || String(event.reason) || '';
    if (shouldSuppress(message)) {
      event.preventDefault();
    }
  });
}

