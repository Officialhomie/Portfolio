/**
 * useProjectVoting Hook Tests
 * Tests for ProjectVoting hook with Privy integration and registration checks
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useVote } from '@/hooks/contracts/useProjectVoting';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { useAccount, useReadContract } from 'wagmi';

// Mock dependencies
vi.mock('@/hooks/usePrivyWallet');
vi.mock('wagmi', async () => {
  const actual = await vi.importActual('wagmi');
  return {
    ...actual,
    useAccount: vi.fn(),
    useReadContract: vi.fn(),
  };
});

describe('useVote', () => {
  const mockEOAAddress = '0x1234567890123456789012345678901234567890' as const;
  const mockSmartWalletAddress = '0x9876543210987654321098765432109876543210' as const;
  const mockProjectId = 'test-project';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should register wallet before voting if not registered', async () => {
    const mockSendTransaction = vi.fn().mockResolvedValue({
      txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    });

    (useAccount as any).mockReturnValue({
      address: mockEOAAddress,
      chainId: 8453,
    });

    (usePrivyWallet as any).mockReturnValue({
      smartWalletAddress: mockSmartWalletAddress,
      eoaAddress: mockEOAAddress,
      sendTransaction: mockSendTransaction,
      isSendingTransaction: false,
      error: null,
    });

    // First call: check registration (not registered)
    // Second call: vote
    (useReadContract as any)
      .mockReturnValueOnce({
        data: '0x0000000000000000000000000000000000000000', // Not registered
      })
      .mockReturnValueOnce({
        data: false, // hasVoted
      });

    const { result } = renderHook(() => useVote(mockProjectId));

    await result.current.vote();

    // Should have called sendTransaction twice: once for registration, once for vote
    expect(mockSendTransaction).toHaveBeenCalledTimes(2);
  });

  it('should vote directly if wallet already registered', async () => {
    const mockSendTransaction = vi.fn().mockResolvedValue({
      txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    });

    (useAccount as any).mockReturnValue({
      address: mockEOAAddress,
      chainId: 8453,
    });

    (usePrivyWallet as any).mockReturnValue({
      smartWalletAddress: mockSmartWalletAddress,
      eoaAddress: mockEOAAddress,
      sendTransaction: mockSendTransaction,
      isSendingTransaction: false,
      error: null,
    });

    // Wallet is registered
    (useReadContract as any).mockReturnValue({
      data: mockEOAAddress, // Registered to EOA
    });

    const { result } = renderHook(() => useVote(mockProjectId));

    await result.current.vote();

    // Should only call sendTransaction once (for vote, not registration)
    expect(mockSendTransaction).toHaveBeenCalledTimes(1);
  });
});


