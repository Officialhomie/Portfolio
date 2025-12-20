/**
 * User-Friendly Error Messages for Biometric Authentication
 * Maps technical errors to helpful, actionable messages
 */

export interface BiometricError {
  title: string;
  message: string;
  suggestion: string;
  learnMoreUrl?: string;
  canRetry: boolean;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Map error messages to user-friendly explanations
 */
export function getBiometricErrorMessage(error: Error | string): BiometricError {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorLower = errorMessage.toLowerCase();

  // Public key not registered
  if (errorLower.includes('public key not registered')) {
    return {
      title: 'Setup Required',
      message: 'Your biometric key is not registered on this contract yet.',
      suggestion: 'Please complete biometric setup in Settings to register your key on all contracts.',
      canRetry: false,
      severity: 'error',
    };
  }

  // Invalid nonce
  if (errorLower.includes('invalid nonce')) {
    return {
      title: 'Transaction Out of Sync',
      message: 'Your transaction nonce is out of sync. This usually happens if a transaction is still pending.',
      suggestion: 'Please wait for pending transactions to complete, then try again.',
      canRetry: true,
      severity: 'error',
    };
  }

  // Invalid signature
  if (errorLower.includes('invalid signature')) {
    return {
      title: 'Signature Verification Failed',
      message: 'The biometric signature could not be verified.',
      suggestion: 'Please try authenticating again. If the problem persists, try re-registering your biometric key in Settings.',
      canRetry: true,
      severity: 'error',
    };
  }

  // NotAllowedError (user cancelled or timeout)
  if (errorLower.includes('notallowederror') || errorLower.includes('user cancelled')) {
    return {
      title: 'Authentication Cancelled',
      message: 'Biometric authentication was cancelled or timed out.',
      suggestion: 'Please try again and complete the biometric authentication when prompted.',
      canRetry: true,
      severity: 'info',
    };
  }

  // NotSupportedError (biometric not available)
  if (errorLower.includes('notsupportederror') || errorLower.includes('not supported')) {
    return {
      title: 'Biometric Not Available',
      message: 'Your device does not support biometric authentication or it is disabled.',
      suggestion: 'Please enable Touch ID, Face ID, or fingerprint authentication in your device settings.',
      learnMoreUrl: 'https://support.apple.com/en-us/HT201371',
      canRetry: false,
      severity: 'error',
    };
  }

  // InvalidStateError (credential already exists)
  if (errorLower.includes('invalidstateerror')) {
    return {
      title: 'Credential Already Exists',
      message: 'A biometric credential already exists for this account.',
      suggestion: 'You may need to clear your existing biometric setup before creating a new one.',
      canRetry: false,
      severity: 'warning',
    };
  }

  // Contract not trusted
  if (errorLower.includes('not in the trusted whitelist') || errorLower.includes('contract validation')) {
    return {
      title: 'Untrusted Contract',
      message: 'The contract you are trying to interact with is not in our trusted whitelist.',
      suggestion: 'For your security, we only allow biometric signing for verified contracts. This may be a phishing attempt.',
      canRetry: false,
      severity: 'error',
    };
  }

  // Insufficient tokens
  if (errorLower.includes('insufficient tokens') || errorLower.includes('insufficient balance')) {
    return {
      title: 'Insufficient Tokens',
      message: 'You do not have enough HOMIE tokens for this transaction.',
      suggestion: 'Please claim tokens from the faucet or acquire more HOMIE tokens before trying again.',
      canRetry: false,
      severity: 'error',
    };
  }

  // Already voted
  if (errorLower.includes('already voted')) {
    return {
      title: 'Already Voted',
      message: 'You have already voted for this project.',
      suggestion: 'Each user can only vote once per project. Your previous vote has been recorded.',
      canRetry: false,
      severity: 'info',
    };
  }

  // Faucet cooldown
  if (errorLower.includes('faucet cooldown') || errorLower.includes('cooldown active')) {
    return {
      title: 'Faucet Cooldown Active',
      message: 'You need to wait before claiming from the faucet again.',
      suggestion: 'Please check back in 24 hours to claim more tokens.',
      canRetry: false,
      severity: 'info',
    };
  }

  // DER signature parsing errors
  if (errorLower.includes('invalid der signature') || errorLower.includes('der format')) {
    return {
      title: 'Signature Format Error',
      message: 'The biometric signature is in an invalid format.',
      suggestion: 'This is usually a temporary issue. Please try again. If it persists, your device may not be compatible.',
      canRetry: true,
      severity: 'error',
    };
  }

  // Network errors
  if (errorLower.includes('network') || errorLower.includes('fetch failed')) {
    return {
      title: 'Network Error',
      message: 'Could not connect to the blockchain network.',
      suggestion: 'Please check your internet connection and make sure you are connected to the correct network.',
      canRetry: true,
      severity: 'error',
    };
  }

  // User rejected transaction
  if (errorLower.includes('user rejected') || errorLower.includes('user denied')) {
    return {
      title: 'Transaction Rejected',
      message: 'You rejected the transaction in your wallet.',
      suggestion: 'Please try again and approve the transaction when prompted.',
      canRetry: true,
      severity: 'info',
    };
  }

  // Gas estimation failed
  if (errorLower.includes('gas') || errorLower.includes('out of gas')) {
    return {
      title: 'Gas Estimation Failed',
      message: 'Could not estimate gas for this transaction.',
      suggestion: 'You may not have enough ETH for gas fees, or the transaction may fail. Please check your balance and try again.',
      canRetry: true,
      severity: 'error',
    };
  }

  // Contract paused
  if (errorLower.includes('paused')) {
    return {
      title: 'Contract Paused',
      message: 'This contract is temporarily paused by administrators.',
      suggestion: 'Please try again later. Check our status page for updates.',
      canRetry: false,
      severity: 'warning',
    };
  }

  // Max supply reached
  if (errorLower.includes('max supply')) {
    return {
      title: 'Maximum Supply Reached',
      message: 'The maximum token supply has been reached.',
      suggestion: 'No more tokens can be minted at this time.',
      canRetry: false,
      severity: 'info',
    };
  }

  // Generic fallback
  return {
    title: 'Transaction Failed',
    message: errorMessage || 'An unexpected error occurred during biometric authentication.',
    suggestion: 'Please try again. If the problem persists, contact support with the error details.',
    canRetry: true,
    severity: 'error',
  };
}

/**
 * Get a short, user-friendly error summary
 */
export function getErrorSummary(error: Error | string): string {
  const biometricError = getBiometricErrorMessage(error);
  return `${biometricError.title}: ${biometricError.suggestion}`;
}

/**
 * Check if an error is recoverable by retrying
 */
export function isRecoverableError(error: Error | string): boolean {
  const biometricError = getBiometricErrorMessage(error);
  return biometricError.canRetry;
}

/**
 * Get error severity level
 */
export function getErrorSeverity(error: Error | string): 'error' | 'warning' | 'info' {
  const biometricError = getBiometricErrorMessage(error);
  return biometricError.severity;
}

/**
 * Format error for logging/debugging
 */
export function formatErrorForLogging(error: Error | string): {
  message: string;
  stack?: string;
  timestamp: string;
  userMessage: string;
} {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  const biometricError = getBiometricErrorMessage(error);

  return {
    message: errorObj.message,
    stack: errorObj.stack,
    timestamp: new Date().toISOString(),
    userMessage: `${biometricError.title}: ${biometricError.message}`,
  };
}
