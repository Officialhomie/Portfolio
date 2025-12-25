/**
 * usePortfolioToken Hook Tests
 * Tests for PortfolioToken hook with Privy integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePortfolioToken } from '@/hooks/contracts/usePortfolioToken';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { useAccount, useReadContracts } from 'wagmi';

// Mock dependencies
vi.mock('@/hooks/usePrivyWallet');
vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi');
  return {
    ...actual,
    useAccount: vi.fn(),
    useReadContracts: vi.fn(),
  };
});

describe('usePortfolioToken', () => {
  const mockEOAAddress = '0x1234567890123456789012345678901234567890' as const;
  const mockSmartWalletAddress = '0x9876543210987654321098765432109876543210' as const;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should read balance from EOA address', () => {
    (useAccount as any).mockReturnValue({
      address: mockEOAAddress,
      chainId: 8453,
    });

    (usePrivyWallet as any).mockReturnValue({
      smartWalletAddress: mockSmartWalletAddress,
      eoaAddress: mockEOAAddress,
    });

    (useReadContracts as any).mockReturnValue({
      data: [
        { result: BigInt('1000000000000000000000000') }, // totalSupply
        { result: BigInt('100000000000000000000') }, // FAUCET_AMOUNT
        { result: BigInt('100000000000000000000') }, // balanceOf
        { result: [true, BigInt(0)] }, // canClaimFaucet
        { result: mockEOAAddress }, // walletToUser
      ],
      isLoading: false,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => usePortfolioToken());

    expect(result.current.balance).toBe('100.0');
    expect(result.current.balanceRaw).toBe(BigInt('100000000000000000000'));
  });

  it('should detect unregistered wallet', () => {
    (useAccount as any).mockReturnValue({
      address: mockEOAAddress,
      chainId: 8453,
    });

    (usePrivyWallet as any).mockReturnValue({
      smartWalletAddress: mockSmartWalletAddress,
      eoaAddress: mockEOAAddress,
    });

    (useReadContracts as any).mockReturnValue({
      data: [
        { result: BigInt('1000000000000000000000000') },
        { result: BigInt('100000000000000000000') },
        { result: BigInt(0) },
        { result: [true, BigInt(0)] },
        { result: '0x0000000000000000000000000000000000000000' }, // Not registered
      ],
      isLoading: false,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => usePortfolioToken());

    expect(result.current.needsWalletRegistration).toBe(true);
    expect(result.current.isWalletRegistered).toBe(false);
  });

  it('should detect registered wallet', () => {
    (useAccount as any).mockReturnValue({
      address: mockEOAAddress,
      chainId: 8453,
    });

    (usePrivyWallet as any).mockReturnValue({
      smartWalletAddress: mockSmartWalletAddress,
      eoaAddress: mockEOAAddress,
    });

    (useReadContracts as any).mockReturnValue({
      data: [
        { result: BigInt('1000000000000000000000000') },
        { result: BigInt('100000000000000000000') },
        { result: BigInt('100000000000000000000') },
        { result: [false, BigInt(86400)] },
        { result: mockEOAAddress }, // Registered to EOA
      ],
      isLoading: false,
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => usePortfolioToken());

    expect(result.current.needsWalletRegistration).toBe(false);
    expect(result.current.isWalletRegistered).toBe(true);
  });
});


