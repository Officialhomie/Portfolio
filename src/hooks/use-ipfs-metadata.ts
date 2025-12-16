'use client';

/**
 * IPFS Metadata Hook
 * Fetches and caches IPFS metadata
 */

import { useEffect, useState } from 'react';
import { fetchIPFSMetadata } from '@/lib/ipfs/client';
import type { ProjectNFTMetadata } from '@/lib/types/metadata';

export function useIPFSMetadata(uri: string | undefined) {
  const [metadata, setMetadata] = useState<ProjectNFTMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!uri) {
      setMetadata(null);
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchIPFSMetadata<ProjectNFTMetadata>(uri);
        if (!cancelled) {
          setMetadata(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
          console.error('Failed to fetch IPFS metadata:', err);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [uri]);

  return {
    metadata,
    isLoading,
    error,
  };
}
