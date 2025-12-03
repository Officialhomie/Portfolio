// IPFS client configuration
// Can be configured with Pinata or Web3.Storage
// This module is client-only to avoid SSR issues with electron-fetch

export interface IPFSUploadResult {
  cid: string
  path: string
}

/**
 * Get IPFS gateway URL (simple utility, no client needed)
 */
export function getIPFSGatewayURL(cid: string): string {
  return `https://ipfs.io/ipfs/${cid}`
}

/**
 * Get Pinata gateway URL (if using Pinata)
 */
export function getPinataGatewayURL(cid: string): string {
  return `https://gateway.pinata.cloud/ipfs/${cid}`
}

// Client-side only functions - use dynamic import
let ipfsClientPromise: Promise<any> | null = null

async function getIpfsClient() {
  if (typeof window === 'undefined') {
    throw new Error('IPFS client can only be used on the client side')
  }
  
  if (!ipfsClientPromise) {
    ipfsClientPromise = (async () => {
      const ipfsModule = await import('ipfs-http-client')
      const { create } = ipfsModule
      
      return create({
        host: 'ipfs.infura.io',
        port: 5001,
        protocol: 'https',
        headers: {
          authorization: process.env.NEXT_PUBLIC_INFURA_IPFS_AUTH || '',
        },
      })
    })()
  }
  
  return ipfsClientPromise
}

/**
 * Upload file to IPFS (client-side only)
 */
export async function uploadToIPFS(file: File | Blob): Promise<IPFSUploadResult> {
  try {
    const client = await getIpfsClient()
    const result = await client.add(file)
    return {
      cid: result.cid.toString(),
      path: result.path,
    }
  } catch (error) {
    console.error('Error uploading to IPFS:', error)
    throw error
  }
}

/**
 * Upload JSON data to IPFS (client-side only)
 */
export async function uploadJSONToIPFS(data: Record<string, unknown>): Promise<IPFSUploadResult> {
  try {
    const client = await getIpfsClient()
    const jsonString = JSON.stringify(data)
    const jsonBuffer = Buffer.from(jsonString)
    const result = await client.add(jsonBuffer)
    return {
      cid: result.cid.toString(),
      path: result.path,
    }
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error)
    throw error
  }
}

export default getIpfsClient
