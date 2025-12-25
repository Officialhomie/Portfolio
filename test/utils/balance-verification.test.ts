/**
 * Balance Verification Utility Tests
 * Tests for balance consistency and registration checking utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  verifyBalanceConsistency,
  checkWalletRegistration,
  getBalanceBreakdown,
} from '@/lib/utils/balance-verification';
import type { PublicClient } from 'viem';

describe('balance-verification', () => {
  const mockEOAAddress = '0x1234567890123456789012345678901234567890' as const;
  const mockSmartWalletAddress = '0x9876543210987654321098765432109876543210' as const;
  const mockTokenContract = '0x1111111111111111111111111111111111111111' as const;
  const mockPortfolioToken = '0x2222222222222222222222222222222222222222' as const;
  const mockProjectVoting = '0x3333333333333333333333333333333333333333' as const;

  let mockPublicClient: Partial<PublicClient>;

  beforeEach(() => {
    mockPublicClient = {
      readContract: vi.fn(),
    };
  });

  describe('verifyBalanceConsistency', () => {
    it('should return consistent when smart wallet has no balance', async () => {
      (mockPublicClient.readContract as any)
        .mockResolvedValueOnce(BigInt('100000000000000000000')) // EOA balance
        .mockResolvedValueOnce(BigInt(0)); // Smart wallet balance

      const result = await verifyBalanceConsistency(
        mockEOAAddress,
        mockSmartWalletAddress,
        mockTokenContract,
        mockPublicClient as PublicClient
      );

      expect(result.isConsistent).toBe(true);
      expect(result.eoaBalance).toBe(BigInt('100000000000000000000'));
      expect(result.smartWalletBalance).toBe(BigInt(0));
      expect(result.warning).toBeUndefined();
    });

    it('should return inconsistent when smart wallet has balance', async () => {
      (mockPublicClient.readContract as any)
        .mockResolvedValueOnce(BigInt(0)) // EOA balance
        .mockResolvedValueOnce(BigInt('100000000000000000000')); // Smart wallet balance

      const result = await verifyBalanceConsistency(
        mockEOAAddress,
        mockSmartWalletAddress,
        mockTokenContract,
        mockPublicClient as PublicClient
      );

      expect(result.isConsistent).toBe(false);
      expect(result.warning).toContain('Tokens detected in smart wallet');
    });
  });

  describe('checkWalletRegistration', () => {
    it('should detect registered wallet in both contracts', async () => {
      (mockPublicClient.readContract as any)
        .mockResolvedValueOnce(mockEOAAddress) // PortfolioToken registration
        .mockResolvedValueOnce(mockEOAAddress); // ProjectVoting registration

      const result = await checkWalletRegistration(
        mockSmartWalletAddress,
        mockEOAAddress,
        {
          portfolioToken: mockPortfolioToken,
          projectVoting: mockProjectVoting,
        },
        mockPublicClient as PublicClient
      );

      expect(result.portfolioToken.registered).toBe(true);
      expect(result.projectVoting.registered).toBe(true);
      expect(result.allRegistered).toBe(true);
    });

    it('should detect partial registration', async () => {
      (mockPublicClient.readContract as any)
        .mockResolvedValueOnce(mockEOAAddress) // PortfolioToken registered
        .mockResolvedValueOnce('0x0000000000000000000000000000000000000000'); // ProjectVoting not registered

      const result = await checkWalletRegistration(
        mockSmartWalletAddress,
        mockEOAAddress,
        {
          portfolioToken: mockPortfolioToken,
          projectVoting: mockProjectVoting,
        },
        mockPublicClient as PublicClient
      );

      expect(result.portfolioToken.registered).toBe(true);
      expect(result.projectVoting.registered).toBe(false);
      expect(result.allRegistered).toBe(false);
    });
  });

  describe('getBalanceBreakdown', () => {
    it('should return detailed balance breakdown', async () => {
      (mockPublicClient.readContract as any)
        .mockResolvedValueOnce(BigInt('100000000000000000000')) // EOA balance
        .mockResolvedValueOnce(BigInt(0)); // Smart wallet balance

      const result = await getBalanceBreakdown(
        mockEOAAddress,
        mockSmartWalletAddress,
        mockTokenContract,
        mockPublicClient as PublicClient
      );

      expect(result.eoaAddress).toBe(mockEOAAddress);
      expect(result.smartWalletAddress).toBe(mockSmartWalletAddress);
      expect(result.eoaBalance).toBe(BigInt('100000000000000000000'));
      expect(result.smartWalletBalance).toBe(BigInt(0));
      expect(result.totalBalance).toBe(BigInt('100000000000000000000'));
      expect(result.isConsistent).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should generate warnings for inconsistent balances', async () => {
      (mockPublicClient.readContract as any)
        .mockResolvedValueOnce(BigInt(0)) // EOA balance
        .mockResolvedValueOnce(BigInt('100000000000000000000')); // Smart wallet balance

      const result = await getBalanceBreakdown(
        mockEOAAddress,
        mockSmartWalletAddress,
        mockTokenContract,
        mockPublicClient as PublicClient
      );

      expect(result.isConsistent).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('smart wallet');
    });
  });
});


