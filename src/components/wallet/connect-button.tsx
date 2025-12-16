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

  // If connected, show address and disconnect option
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium">
            {formatAddress(address)}
          </span>
          {chain && (
            <span className="text-xs text-muted-foreground">
              {chain.name}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          onClick={() => disconnect()}
          size="sm"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  // Use AppKit button for connection
  return <AppKitConnectButton />;
}

