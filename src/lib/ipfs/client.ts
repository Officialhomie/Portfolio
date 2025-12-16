/**
 * IPFS client utilities
 * Handles IPFS gateway resolution and metadata fetching
 */

/**
 * IPFS gateways (in order of preference)
 */
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://dweb.link/ipfs/',
] as const;

/**
 * Resolve IPFS URI to HTTP URL
 */
export function resolveIPFSUri(uri: string, gatewayIndex = 0): string {
  if (!uri) return '';

  // If already HTTP(S), return as-is
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    return uri;
  }

  // Handle ipfs:// protocol
  if (uri.startsWith('ipfs://')) {
    const cid = uri.replace('ipfs://', '');
    return `${IPFS_GATEWAYS[gatewayIndex]}${cid}`;
  }

  // Handle raw CID (assume IPFS)
  if (uri.match(/^Qm[a-zA-Z0-9]{44}$|^ba[a-zA-Z0-9]+$/)) {
    return `${IPFS_GATEWAYS[gatewayIndex]}${uri}`;
  }

  return uri;
}

/**
 * Fetch IPFS metadata with fallback to multiple gateways
 */
export async function fetchIPFSMetadata<T = any>(uri: string): Promise<T | null> {
  if (!uri) return null;

  // Try each gateway in order
  for (let i = 0; i < IPFS_GATEWAYS.length; i++) {
    try {
      const url = resolveIPFSUri(uri, i);
      const response = await fetch(url, {
        next: { revalidate: false }, // Cache indefinitely (IPFS is immutable)
      });

      if (response.ok) {
        return await response.json() as T;
      }
    } catch (error) {
      console.warn(`Failed to fetch from gateway ${i}:`, error);
      // Continue to next gateway
    }
  }

  console.error('Failed to fetch IPFS metadata from all gateways:', uri);
  return null;
}

/**
 * Validate IPFS CID format
 */
export function isValidIPFSCid(cid: string): boolean {
  // CIDv0: starts with Qm, 46 characters
  if (/^Qm[a-zA-Z0-9]{44}$/.test(cid)) {
    return true;
  }

  // CIDv1: starts with b or z
  if (/^b[a-z2-7]{58,}$/.test(cid) || /^z[a-zA-Z0-9]+$/.test(cid)) {
    return true;
  }

  return false;
}

/**
 * Extract CID from IPFS URI
 */
export function extractCidFromUri(uri: string): string | null {
  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', '').split('/')[0];
  }

  if (isValidIPFSCid(uri)) {
    return uri;
  }

  return null;
}

/**
 * Get all gateway URLs for a given URI
 */
export function getAllGatewayUrls(uri: string): string[] {
  return IPFS_GATEWAYS.map((_, index) => resolveIPFSUri(uri, index));
}
