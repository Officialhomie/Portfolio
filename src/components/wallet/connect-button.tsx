'use client';

/**
 * Custom Connect Button Component
 * Shows connection status and wallet address when connected
 */

import { useAccount, useDisconnect } from 'wagmi';
import { AppKitConnectButton } from '@reown/appkit/react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { formatAddress } from '@/lib/utils/format';
import { LogOut } from 'lucide-react';

export function ConnectButton() {
  const { address, isConnected, chain } = useAccount();
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

  // If connected, show compact wallet badge
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="wallet-badge">
          <div className="wallet-status-dot"></div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-mono font-semibold text-foreground dark:text-white leading-tight truncate max-w-[120px]">
              {formatAddress(address)}
            </span>
            {chain && (
              <span className="text-[10px] text-muted-foreground leading-tight truncate">
                {chain.name}
              </span>
            )}
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

