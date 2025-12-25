'use client';

/**
 * Custom Connect Button Component
 * Shows SMART WALLET address when connected (not EOA)
 * The EOA is hidden from the user - they only interact with their smart wallet
 * Uses Privy's LoginButton to show all login methods (email, Google, etc.)
 */

import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { LogOut, Wallet } from 'lucide-react';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { SmartWalletInfo } from './smart-wallet-info';

export function ConnectButton() {
  const { isConnected } = useAccount();
  const {
    smartWalletAddress,
    isSmartWalletReady,
    isSendingTransaction,
    connect,
    disconnect
  } = usePrivyWallet();
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show nothing during SSR
  if (!mounted) {
    return (
      <Button variant="outline" disabled>
        Connect Wallet
      </Button>
    );
  }

  // If connected, show smart wallet info
  if (isConnected) {
    // Show loading state while initializing
    if (isSendingTransaction && !smartWalletAddress) {
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

    // Show smart wallet address if available
    if (smartWalletAddress && isSmartWalletReady) {
      return (
        <div className="flex items-center gap-2">
          {/* Smart Wallet Info Dropdown */}
          <SmartWalletInfo />

          {/* Disconnect Button */}
          <Button
            variant="ghost"
            onClick={() => disconnect()}
            size="sm"
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-300 rounded-md"
            title="Disconnect wallet"
            aria-label="Disconnect wallet"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    // Fallback: show connected state
    return (
      <div className="flex items-center gap-2">
        <SmartWalletInfo />
        <Button
          variant="ghost"
          onClick={() => disconnect()}
          size="sm"
          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-all duration-300 rounded-md"
          title="Disconnect wallet"
          aria-label="Disconnect wallet"
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

