'use client';

/**
 * Custom Connect Button Component
 * Shows SMART WALLET address when connected (not EOA)
 * The EOA is hidden from the user - they only interact with their smart wallet
 * Uses Privy's LoginButton to show all login methods (email, Google, etc.)
 */

import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { useEffect, useState, useRef } from 'react';
import { LogOut, Wallet } from 'lucide-react';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { SmartWalletInfo } from './smart-wallet-info';

export function ConnectButton() {
  const { isConnected } = useAccount();
  const {
    smartWalletAddress,
    isSmartWalletReady,
    isSendingTransaction,
    isConnected: isPrivyConnected,
    connect,
    disconnect,
    privy
  } = usePrivyWallet();
  const [mounted, setMounted] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const disconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
      }
    };
  }, []);

  // Reset disconnecting state when connection status changes
  useEffect(() => {
    if (!isPrivyConnected && !isConnected) {
      setIsDisconnecting(false);
    }
  }, [isPrivyConnected, isConnected]);

  // Handle disconnect with debounce to prevent multiple calls
  const handleDisconnect = async () => {
    if (isDisconnecting) {
      console.log('⏳ Disconnect already in progress, ignoring...');
      return;
    }

    setIsDisconnecting(true);
    console.log('🚪 Disconnecting wallet...');

    try {
      await disconnect();
      console.log('✅ Wallet disconnected successfully');
    } catch (error) {
      console.error('❌ Disconnect error:', error);
    } finally {
      // Reset disconnecting state after a delay
      disconnectTimeoutRef.current = setTimeout(() => {
        setIsDisconnecting(false);
      }, 2000);
    }
  };

  // Show nothing during SSR
  if (!mounted) {
    return (
      <Button variant="outline" disabled>
        Connect Wallet
      </Button>
    );
  }

  // Use Privy's authenticated state as the source of truth
  // This prevents race conditions between Privy and Wagmi state
  const isActuallyConnected = isPrivyConnected && privy.authenticated;

  // If disconnecting, show loading state
  if (isDisconnecting) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <div className="w-4 h-4 border-2 border-muted-foreground/20 border-t-muted-foreground rounded-full animate-spin" />
        Disconnecting...
      </Button>
    );
  }

  // If connected, show wallet info
  if (isActuallyConnected) {
    // Show loading state while initializing
    if (isSendingTransaction && !smartWalletAddress && !isConnected) {
      return (
        <div className="flex items-center gap-2">
          <div className="wallet-badge">
            <div className="wallet-status-dot animate-pulse bg-yellow-500"></div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-mono font-semibold text-foreground dark:text-white leading-tight">
                Initializing...
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                Setting up wallet
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Show wallet info (works for both smart wallets and EOA wallets)
    return (
      <div className="flex items-center gap-2">
        {/* Wallet Info Dropdown - shows smart wallet if available, otherwise EOA */}
        <SmartWalletInfo />

        {/* Disconnect Button */}
        <Button
          variant="ghost"
          onClick={handleDisconnect}
          size="sm"
          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-300 rounded-md"
          title="Disconnect wallet"
          aria-label="Disconnect wallet"
          disabled={isDisconnecting}
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // Use Privy's login() method which shows a modal with all login methods
  // (email, Google, wallet, etc.) - configured in PrivyProvider
  // The modal will automatically show all enabled login methods from the config
  return (
    <Button
      onClick={() => connect()}
      variant="default"
      className="gap-2"
    >
      <Wallet className="w-4 h-4" />
      Connect Wallet
    </Button>
  );
}

