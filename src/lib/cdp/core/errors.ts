/**
 * Custom error classes for ERC-4337 Smart Account System
 * Provides structured error handling with error codes
 */

import { ERROR_CODES } from './constants';

/**
 * Base error class for all smart account errors
 */
export class SmartAccountError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SmartAccountError';
    Object.setPrototypeOf(this, SmartAccountError.prototype);
  }
}

/**
 * Signer-related errors
 */
export class SignerError extends SmartAccountError {
  constructor(message: string, code: string = ERROR_CODES.SIGNER_NOT_INITIALIZED, details?: unknown) {
    super(message, code, details);
    this.name = 'SignerError';
    Object.setPrototypeOf(this, SignerError.prototype);
  }
}

/**
 * Account-related errors
 */
export class AccountError extends SmartAccountError {
  constructor(message: string, code: string = ERROR_CODES.ACCOUNT_NOT_DEPLOYED, details?: unknown) {
    super(message, code, details);
    this.name = 'AccountError';
    Object.setPrototypeOf(this, AccountError.prototype);
  }
}

/**
 * Bundler-related errors
 */
export class BundlerError extends SmartAccountError {
  constructor(message: string, code: string = ERROR_CODES.BUNDLER_RPC_ERROR, details?: unknown) {
    super(message, code, details);
    this.name = 'BundlerError';
    Object.setPrototypeOf(this, BundlerError.prototype);
  }
}

/**
 * Factory-related errors
 */
export class FactoryError extends SmartAccountError {
  constructor(message: string, code: string = ERROR_CODES.FACTORY_NOT_CONFIGURED, details?: unknown) {
    super(message, code, details);
    this.name = 'FactoryError';
    Object.setPrototypeOf(this, FactoryError.prototype);
  }
}

/**
 * Paymaster-related errors
 */
export class PaymasterError extends SmartAccountError {
  constructor(message: string, code: string = ERROR_CODES.PAYMASTER_NOT_CONFIGURED, details?: unknown) {
    super(message, code, details);
    this.name = 'PaymasterError';
    Object.setPrototypeOf(this, PaymasterError.prototype);
  }
}

/**
 * UserOperation-related errors
 */
export class UserOperationError extends SmartAccountError {
  constructor(message: string, code: string = ERROR_CODES.USEROP_REJECTED, details?: unknown) {
    super(message, code, details);
    this.name = 'UserOperationError';
    Object.setPrototypeOf(this, UserOperationError.prototype);
  }
}

