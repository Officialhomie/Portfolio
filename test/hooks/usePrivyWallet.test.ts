/**
 * usePrivyWallet Hook Tests
 * Tests for Privy wallet hook functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { usePrivy, useWallets, useSmartWallets } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';

// Mock Privy hooks
vi.mock('@privy-io/react-auth', () => ({
  usePrivy: vi.fn(),
  useWallets: vi.fn(),
  useSmartWallets: vi.fn(),
}));

vi.mock('wagmi', () => ({
  useAccount: vi.fn(),
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
}));

describe('usePrivyWallet', () => {
  const mockEOAAddress = '0x1234567890123456789012345678901234567890' as const;
  const mockSmartWalletAddress = '0x9876543210987654321098765432109876543210' as const;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return EOA address when connected', () => {
    (usePrivy as any).mockReturnValue({
      authenticated: true,
      ready: true,
      user: { wallet: { address: mockEOAAddress } },
    });
    (useWallets as any).mockReturnValue({ wallets: [] });
    (useSmartWallets as any).mockReturnValue({ smartWallets: [] });
    (useAccount as any).mockReturnValue({
      address: mockEOAAddress,
      chainId: 8453,
    });

    const { result } = renderHook(() => usePrivyWallet());

    expect(result.current.eoaAddress).toBe(mockEOAAddress);
    expect(result.current.isConnected).toBe(true);
  });

  it('should return smart wallet address when available', () => {
    const mockSmartWallet = {
      address: mockSmartWalletAddress,
      deployed: true,
      sendTransaction: vi.fn(),
    };

    (usePrivy as any).mockReturnValue({
      authenticated: true,
      ready: true,
      user: { wallet: { address: mockEOAAddress } },
    });
    (useWallets as any).mockReturnValue({ wallets: [] });
    (useSmartWallets as any).mockReturnValue({
      smartWallets: [mockSmartWallet],
    });
    (useAccount as any).mockReturnValue({
      address: mockEOAAddress,
      chainId: 8453,
    });

    const { result } = renderHook(() => usePrivyWallet());

    expect(result.current.smartWalletAddress).toBe(mockSmartWalletAddress);
    expect(result.current.isSmartWalletReady).toBe(true);
    expect(result.current.isSmartWalletDeployed).toBe(true);
  });

  it('should handle transaction sending with smart wallet', async () => {
    const mockTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890' as const;
    const mockSmartWallet = {
      address: mockSmartWalletAddress,
      deployed: true,
      sendTransaction: vi.fn().mockResolvedValue(mockTxHash),
    };

    (usePrivy as any).mockReturnValue({
      authenticated: true,
      ready: true,
      user: { wallet: { address: mockEOAAddress } },
    });
    (useWallets as any).mockReturnValue({ wallets: [] });
    (useSmartWallets as any).mockReturnValue({
      smartWallets: [mockSmartWallet],
    });
    (useAccount as any).mockReturnValue({
      address: mockEOAAddress,
      chainId: 8453,
    });

    const { result } = renderHook(() => usePrivyWallet());

    const call = {
      to: '0x1111111111111111111111111111111111111111' as const,
      data: '0x1234' as const,
      value: 0n,
    };

    const txResult = await result.current.sendTransaction(call);

    expect(mockSmartWallet.sendTransaction).toHaveBeenCalledWith({
      to: call.to,
      data: call.data,
      value: 0n,
    });
    expect(txResult.txHash).toBe(mockTxHash);
    expect(txResult.userOpHash).toBe(mockTxHash);
  });

  it('should handle connection and disconnection', () => {
    const mockLogin = vi.fn();
    const mockLogout = vi.fn();

    (usePrivy as any).mockReturnValue({
      authenticated: false,
      ready: true,
      login: mockLogin,
      logout: mockLogout,
    });
    (useWallets as any).mockReturnValue({ wallets: [] });
    (useSmartWallets as any).mockReturnValue({ smartWallets: [] });
    (useAccount as any).mockReturnValue({
      address: null,
      chainId: 8453,
    });

    const { result } = renderHook(() => usePrivyWallet());

    result.current.connect();
    expect(mockLogin).toHaveBeenCalled();

    result.current.disconnect();
    expect(mockLogout).toHaveBeenCalled();
  });
});


