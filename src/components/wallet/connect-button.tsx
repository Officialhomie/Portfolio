'use client';

/**
 * Custom Connect Button Component
 * Shows SMART WALLET address when connected (not EOA)
 * The EOA is hidden from the user - they only interact with their smart wallet
 */

import { useAccount, useDisconnect } from 'wagmi';
import { AppKitConnectButton } from '@reown/appkit/react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { formatAddress } from '@/lib/utils/format';
import { LogOut, Sparkles } from 'lucide-react';
import { useSmartWallet } from '@/contexts/SmartWalletContext';
import { SmartWalletInfo } from './smart-wallet-info';

export function ConnectButton() {
  const { isConnected, chain } = useAccount();
  const {
    smartWalletAddress,
    isSmartWalletReady,
    isCreatingSmartWallet,
    balance
  } = useSmartWallet();
  const { disconnect } = useDisconnect();
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

  // If connected, show smart wallet (NOT EOA!)
  if (isConnected) {
    // Show loading state while creating smart wallet
    if (isCreatingSmartWallet) {
      return (
        <div className="flex items-center gap-2">
          <div className="wallet-badge">
            <div className="wallet-status-dot animate-pulse bg-yellow-500"></div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-mono font-semibold text-foreground dark:text-white leading-tight">
                Setting up your gas-free wallet...
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                ERC-4337 smart account
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Show smart wallet address (NEVER show EOA)
    if (smartWalletAddress && isSmartWalletReady) {
      const formatBalance = (bal: bigint | null) => {
        if (bal === null) return '0';
        const eth = Number(bal) / 1e18;
        return eth < 0.0001 ? '< 0.0001' : eth.toFixed(4);
      };

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

    // Fallback: show setup required
    return (
      <div className="flex items-center gap-2">
        <div className="wallet-badge">
          <div className="wallet-status-dot bg-amber-500"></div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-mono font-semibold text-foreground dark:text-white leading-tight">
              Wallet Connected
            </span>
            <span className="text-[10px] text-muted-foreground leading-tight truncate">
              Setting up gas-free features
            </span>
          </div>
        </div>
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

  // Use AppKit button for connection
  return <AppKitConnectButton />;
}

