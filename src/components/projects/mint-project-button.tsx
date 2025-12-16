'use client';

/**
 * Mint Project Button
 * Allows users to mint a GitHub project as an NFT so it can be voted on
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMintProject } from '@/hooks/contracts/useProjectNFT';
import { useAccount } from 'wagmi';
import { Loader2, Sparkles } from 'lucide-react';
import type { ProjectMetadata } from '@/lib/github/types';

interface MintProjectButtonProps {
  project: ProjectMetadata;
  size?: 'sm' | 'lg';
}

export function MintProjectButton({ project, size = 'sm' }: MintProjectButtonProps) {
  const { isConnected } = useAccount();
  const { mintProject, isPending, isConfirming } = useMintProject();
  const [isMinting, setIsMinting] = useState(false);

  const handleMint = async () => {
    if (!isConnected) {
      alert('Please connect your wallet to mint this project as an NFT');
      return;
    }

    try {
      setIsMinting(true);
      // Create project metadata for IPFS
      const metadata = {
        name: project.name,
        description: project.description,
        image: project.image || '/images/placeholder-project.png',
        external_url: project.external_url,
        attributes: [
          { trait_type: 'Category', value: project.category },
          { trait_type: 'Status', value: project.status },
          { trait_type: 'Year', value: project.year },
          { trait_type: 'Tech Stack', value: project.tech_stack },
        ],
      };

      // TODO: Upload to IPFS first, then mint
      // For now, we'll use a placeholder URI
      const ipfsUri = `ipfs://placeholder-${project.id}`;
      
      await mintProject(project.id, project.name, ipfsUri);
      alert('Project minted successfully! You can now vote for it.');
    } catch (error: any) {
      alert(error?.message || 'Failed to mint project');
    } finally {
      setIsMinting(false);
    }
  };

  const isLoading = isPending || isConfirming || isMinting;

  if (!isConnected) {
    return (
      <Button size={size} variant="outline" disabled>
        Connect Wallet to Mint
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant="outline"
      onClick={handleMint}
      disabled={isLoading}
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Minting...
        </>
      ) : (
        <>
          <Sparkles className="w-4 h-4" />
          Mint as NFT
        </>
      )}
    </Button>
  );
}

