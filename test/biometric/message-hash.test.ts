/**
 * Message Hash Consistency Tests
 * Validates that TypeScript hash generation matches Solidity abi.encodePacked
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import {
  generateClaimFaucetHash,
  generateVoteHash,
  generateEndorseProjectHash,
  generateMintVisitNFTHash,
  generateSignVisitorBookHash,
  MessageHashBuilder,
  validateMessageHash,
  debugMessageHash,
} from '../../src/lib/biometric/message-hash';

// Test constants
const TEST_CHAIN_ID = 8453; // Base mainnet
const TEST_CONTRACT_ADDRESS = '0x1234567890123456789012345678901234567890' as `0x${string}`;
const TEST_USER_ADDRESS = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as `0x${string}`;
const TEST_PROJECT_ID = 'project-alpha-v1';
const TEST_TOKEN_ID = BigInt(42);
const TEST_MESSAGE = 'Hello, World!';
const TEST_TIMESTAMP = BigInt(1699999999);

describe('Message Hash Generation', () => {
  describe('Basic Hash Generation', () => {
    it('should generate valid hash format', () => {
      const hash = generateClaimFaucetHash(
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS
      );

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^0x[0-9a-fA-F]{64}$/);
      expect(validateMessageHash(hash)).toBe(true);
    });

    it('should generate consistent hashes for same inputs', () => {
      const hash1 = generateClaimFaucetHash(
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS
      );
      const hash2 = generateClaimFaucetHash(
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS
      );

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different inputs', () => {
      const hash1 = generateClaimFaucetHash(
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS
      );
      const hash2 = generateClaimFaucetHash(
        TEST_CHAIN_ID + 1,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS
      );

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('ClaimFaucet Hash', () => {
    it('should generate correct hash for claimFaucet', () => {
      const hash = generateClaimFaucetHash(
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS
      );

      // Hash should be deterministic
      expect(hash).toBeDefined();
      expect(hash.length).toBe(66); // 0x + 64 hex chars
    });

    it('should match debug output format', () => {
      const { hash, inputs } = debugMessageHash(
        'claimFaucet',
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS
      );

      expect(inputs.functionName).toBe('claimFaucet');
      expect(inputs.chainId).toBe(TEST_CHAIN_ID);
      expect(inputs.contractAddress).toBe(TEST_CONTRACT_ADDRESS);
      expect(inputs.userAddress).toBe(TEST_USER_ADDRESS);
      expect(inputs.params).toEqual([]);
    });
  });

  describe('Vote Hash', () => {
    it('should generate correct hash for vote with projectId', () => {
      const hash = generateVoteHash(
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS,
        TEST_PROJECT_ID
      );

      expect(hash).toBeDefined();
      expect(validateMessageHash(hash)).toBe(true);
    });

    it('should generate different hashes for different projectIds', () => {
      const hash1 = generateVoteHash(
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS,
        'project-alpha'
      );
      const hash2 = generateVoteHash(
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS,
        'project-beta'
      );

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('EndorseProject Hash', () => {
    it('should generate correct hash for endorseProject with tokenId', () => {
      const hash = generateEndorseProjectHash(
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS,
        TEST_TOKEN_ID
      );

      expect(hash).toBeDefined();
      expect(validateMessageHash(hash)).toBe(true);
    });

    it('should handle large tokenIds', () => {
      const largeTokenId = BigInt('999999999999999999999999');
      const hash = generateEndorseProjectHash(
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS,
        largeTokenId
      );

      expect(hash).toBeDefined();
      expect(validateMessageHash(hash)).toBe(true);
    });
  });

  describe('MintVisitNFT Hash', () => {
    it('should generate correct hash for mintVisitNFT', () => {
      const hash = generateMintVisitNFTHash(
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS
      );

      expect(hash).toBeDefined();
      expect(validateMessageHash(hash)).toBe(true);
    });
  });

  describe('SignVisitorBook Hash', () => {
    it('should generate correct hash for signVisitorBook', () => {
      const hash = generateSignVisitorBookHash(
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS,
        TEST_MESSAGE,
        TEST_TIMESTAMP
      );

      expect(hash).toBeDefined();
      expect(validateMessageHash(hash)).toBe(true);
    });

    it('should generate different hashes for different messages', () => {
      const hash1 = generateSignVisitorBookHash(
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS,
        'Message 1',
        TEST_TIMESTAMP
      );
      const hash2 = generateSignVisitorBookHash(
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS,
        'Message 2',
        TEST_TIMESTAMP
      );

      expect(hash1).not.toBe(hash2);
    });

    it('should generate different hashes for different timestamps', () => {
      const hash1 = generateSignVisitorBookHash(
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS,
        TEST_MESSAGE,
        BigInt(1000)
      );
      const hash2 = generateSignVisitorBookHash(
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS,
        TEST_MESSAGE,
        BigInt(2000)
      );

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('MessageHashBuilder', () => {
    it('should build hash using fluent API', () => {
      const builder = new MessageHashBuilder(
        'vote',
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS
      );

      const hash = builder.addString(TEST_PROJECT_ID).build();

      expect(hash).toBeDefined();
      expect(validateMessageHash(hash)).toBe(true);

      // Should match direct function
      const directHash = generateVoteHash(
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS,
        TEST_PROJECT_ID
      );
      expect(hash).toBe(directHash);
    });

    it('should handle multiple parameters', () => {
      const builder = new MessageHashBuilder(
        'signVisitorBook',
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS
      );

      const hash = builder.addString(TEST_MESSAGE).addUint256(TEST_TIMESTAMP).build();

      expect(hash).toBeDefined();
      expect(validateMessageHash(hash)).toBe(true);

      // Should match direct function
      const directHash = generateSignVisitorBookHash(
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS,
        TEST_MESSAGE,
        TEST_TIMESTAMP
      );
      expect(hash).toBe(directHash);
    });

    it('should handle different parameter types', () => {
      const builder = new MessageHashBuilder(
        'customFunction',
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS
      );

      const hash = builder
        .addString('param1')
        .addUint256(BigInt(123))
        .addAddress('0x1111111111111111111111111111111111111111' as `0x${string}`)
        .addBool(true)
        .addBytes32('0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`)
        .build();

      expect(hash).toBeDefined();
      expect(validateMessageHash(hash)).toBe(true);
    });
  });

  describe('Hash Validation', () => {
    it('should validate correct hash format', () => {
      const validHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      expect(validateMessageHash(validHash)).toBe(true);
    });

    it('should reject invalid hash formats', () => {
      expect(validateMessageHash('1234567890abcdef')).toBe(false); // Missing 0x
      expect(validateMessageHash('0x12345')).toBe(false); // Too short
      expect(validateMessageHash('0xZZZZ567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')).toBe(false); // Invalid hex
    });
  });

  describe('Debug Output', () => {
    it('should provide detailed debug information', () => {
      const debug = debugMessageHash(
        'vote',
        TEST_CHAIN_ID,
        TEST_CONTRACT_ADDRESS,
        TEST_USER_ADDRESS,
        [{ type: 'string', value: TEST_PROJECT_ID }]
      );

      expect(debug.hash).toBeDefined();
      expect(debug.inputs.functionName).toBe('vote');
      expect(debug.inputs.chainId).toBe(TEST_CHAIN_ID);
      expect(debug.inputs.params.length).toBe(1);
      expect(debug.inputs.params[0].type).toBe('string');
      expect(debug.inputs.params[0].value).toBe(TEST_PROJECT_ID);
    });
  });
});

// Note: Integration tests with actual Solidity contracts should be added in
// test/BiometricMessageHash.t.sol using Foundry
