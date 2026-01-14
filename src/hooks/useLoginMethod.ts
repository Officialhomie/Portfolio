'use client';

/**
 * Hook to get the user's login method from Privy
 * Returns the authentication method used (email, google, twitter, etc.)
 */

import { usePrivy } from '@privy-io/react-auth';
import { useMemo } from 'react';

export type LoginMethod = {
  type: 'email' | 'google' | 'twitter' | 'github' | 'discord' | 'apple' | 'wallet' | 'sms' | 'farcaster' | 'telegram' | 'linkedin' | 'tiktok' | 'instagram' | 'spotify';
  address?: string;
  email?: string;
  phone?: string;
  username?: string;
};

export function useLoginMethod() {
  const { user, authenticated } = usePrivy();

  const loginMethods = useMemo(() => {
    if (!authenticated || !user?.linkedAccounts) {
      return [];
    }

    // Map linked accounts to login methods
    const methods: LoginMethod[] = user.linkedAccounts.map((account: any) => {
      const method: LoginMethod = {
        type: account.type,
      };

      // Add identifiers based on account type
      if (account.type === 'email') {
        method.email = account.address;
      } else if (account.type === 'wallet') {
        method.address = account.address;
      } else if (account.type === 'phone' || account.type === 'sms') {
        method.phone = account.phoneNumber;
      } else if (account.type === 'google') {
        method.email = account.email;
        method.username = account.name;
      } else if (account.type === 'twitter') {
        method.username = account.username || account.name;
      } else if (account.type === 'github') {
        method.username = account.username || account.name;
      } else if (account.type === 'discord') {
        method.username = account.username || account.name;
        method.email = account.email;
      } else if (account.type === 'apple') {
        method.email = account.email;
      }

      return method;
    });

    return methods;
  }, [authenticated, user?.linkedAccounts]);

  // Get the primary login method (first in the list)
  const primaryMethod = loginMethods[0] || null;

  return {
    loginMethods,
    primaryMethod,
    hasMultipleMethods: loginMethods.length > 1,
  };
}
