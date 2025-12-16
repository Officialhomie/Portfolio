/**
 * TypeScript types for biometric authentication
 * Supports WebAuthn API and device secure enclave integration
 */

/**
 * Biometric authentication method
 */
export type BiometricMethod = 'fingerprint' | 'face' | 'voice' | 'iris' | 'unknown';

/**
 * Device capability detection result
 */
export interface BiometricCapability {
  /** Whether biometric authentication is available */
  isAvailable: boolean;
  /** Supported biometric methods */
  methods: BiometricMethod[];
  /** Whether device has secure enclave (iOS Secure Enclave, Android StrongBox) */
  hasSecureEnclave: boolean;
  /** Whether WebAuthn API is available */
  hasWebAuthn: boolean;
  /** Platform identifier */
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
}

/**
 * Biometric authentication result
 */
export interface BiometricAuthResult {
  /** Whether authentication was successful */
  success: boolean;
  /** Error message if authentication failed */
  error?: string;
  /** Biometric method used */
  method?: BiometricMethod;
  /** Timestamp of authentication */
  timestamp: number;
  /** Authentication token/signature */
  credentialId?: string;
}

/**
 * Public key coordinates for secp256r1
 */
export interface PublicKeyCoordinates {
  /** X coordinate as bytes32 */
  x: `0x${string}`;
  /** Y coordinate as bytes32 */
  y: `0x${string}`;
}

/**
 * secp256r1 key pair (stored in secure enclave)
 */
export interface Secp256r1KeyPair {
  /** Public key (can be shared) */
  publicKey: Uint8Array;
  /** Public key X coordinate */
  publicKeyX: `0x${string}`;
  /** Public key Y coordinate */
  publicKeyY: `0x${string}`;
  /** Credential ID (for WebAuthn) */
  credentialId: string;
  /** Key handle (for secure enclave) */
  keyHandle: string;
}

/**
 * Transaction signing request with biometric verification
 */
export interface BiometricSignRequest {
  /** Transaction data to sign */
  transactionData: {
    to: `0x${string}`;
    data: `0x${string}`;
    value?: bigint;
    gas?: bigint;
    gasPrice?: bigint;
  };
  /** Message to display to user */
  message?: string;
  /** Whether to require biometric authentication */
  requireBiometric: boolean;
}

/**
 * Biometric signature result
 */
export interface BiometricSignature {
  /** secp256r1 signature */
  signature: Uint8Array;
  /** Public key used for signing */
  publicKey: Uint8Array;
  /** Credential ID */
  credentialId: string;
  /** Signature in hex format */
  signatureHex: `0x${string}`;
  /** Public key in hex format */
  publicKeyHex: `0x${string}`;
}

/**
 * Biometric transaction signature (r, s format)
 */
export interface BiometricTransactionSignature {
  /** Signature r component */
  r: `0x${string}`;
  /** Signature s component */
  s: `0x${string}`;
  /** Public key X coordinate */
  publicKeyX: `0x${string}`;
  /** Public key Y coordinate */
  publicKeyY: `0x${string}`;
}

/**
 * Biometric signed transaction
 */
export interface BiometricSignedTransaction {
  /** Transaction data */
  transactionData: {
    to: `0x${string}`;
    data: `0x${string}`;
    value?: bigint;
    gas?: bigint;
    gasPrice?: bigint;
  };
  /** Biometric signature */
  signature: BiometricTransactionSignature;
  /** Message hash that was signed */
  messageHash: `0x${string}`;
}

/**
 * WebAuthn credential creation options
 */
export interface WebAuthnCredentialOptions {
  /** Relying party ID (domain) */
  rpId: string;
  /** User ID */
  userId: Uint8Array;
  /** User name */
  userName: string;
  /** User display name */
  userDisplayName: string;
  /** Challenge for registration */
  challenge: Uint8Array;
  /** Public key credential parameters */
  pubKeyCredParams: Array<{
    type: 'public-key';
    alg: number; // -7 for ES256 (secp256r1)
  }>;
  /** Timeout in milliseconds */
  timeout?: number;
  /** Attestation preference */
  attestation?: 'none' | 'indirect' | 'direct';
  /** Authenticator selection */
  authenticatorSelection?: {
    authenticatorAttachment?: 'platform' | 'cross-platform';
    requireResidentKey?: boolean;
    userVerification?: 'required' | 'preferred' | 'discouraged';
  };
}

/**
 * WebAuthn assertion options
 */
export interface WebAuthnAssertionOptions {
  /** Relying party ID */
  rpId: string;
  /** Challenge for authentication */
  challenge: Uint8Array;
  /** Allowed credential IDs */
  allowCredentials?: Array<{
    id: Uint8Array;
    type: 'public-key';
    transports?: ('usb' | 'nfc' | 'ble' | 'internal')[];
  }>;
  /** Timeout in milliseconds */
  timeout?: number;
  /** User verification requirement */
  userVerification?: 'required' | 'preferred' | 'discouraged';
}

/**
 * Biometric setup state
 */
export interface BiometricSetupState {
  /** Whether setup is in progress */
  isSettingUp: boolean;
  /** Whether setup is complete */
  isSetup: boolean;
  /** Error during setup */
  setupError?: string;
  /** Generated key pair */
  keyPair?: Secp256r1KeyPair;
}

/**
 * Biometric authentication state
 */
export interface BiometricAuthState {
  /** Whether biometric is enabled */
  isEnabled: boolean;
  /** Whether authentication is in progress */
  isAuthenticating: boolean;
  /** Last authentication result */
  lastAuthResult?: BiometricAuthResult;
  /** Device capabilities */
  capabilities?: BiometricCapability;
  /** Setup state */
  setupState?: BiometricSetupState;
}

/**
 * EIP-7951 precompile verification result
 */
export interface Secp256r1VerificationResult {
  /** Whether signature is valid */
  isValid: boolean;
  /** Recovered public key */
  recoveredPublicKey?: `0x${string}`;
  /** Error message if verification failed */
  error?: string;
}

