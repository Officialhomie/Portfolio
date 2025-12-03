import { Project, ProjectMetadata } from '@/types/project'
import { getIPFSGatewayURL } from './projects-data'

/**
 * Convert Project to ProjectMetadata for IPFS
 */
export function projectToMetadata(project: Project): ProjectMetadata {
  return {
    name: project.name,
    description: project.description,
    image: project.ipfsImageCID 
      ? getIPFSGatewayURL(project.ipfsImageCID)
      : '',
    external_url: project.demoUrl || project.githubUrl,
    attributes: [
      {
        trait_type: 'Tech Stack',
        value: project.techStack.join(', '),
      },
      {
        trait_type: 'GitHub Stars',
        value: project.stats.stars || 0,
      },
      {
        trait_type: 'Forks',
        value: project.stats.forks || 0,
      },
      {
        trait_type: 'Featured',
        value: project.featured ? 'Yes' : 'No',
      },
    ],
  }
}

/**
 * Upload project metadata to IPFS (client-side only)
 * This function uses a fully dynamic import to prevent SSR analysis
 */
export async function uploadProjectMetadata(project: Project): Promise<string> {
  if (typeof window === 'undefined') {
    throw new Error('IPFS functions can only be used on the client side')
  }
  
  // Use Function constructor to create a dynamic import that can't be statically analyzed
  const importIpfs = new Function('return import("./ipfs")')
  const ipfs = await importIpfs()
  const metadata = projectToMetadata(project)
  const result = await ipfs.uploadJSONToIPFS(metadata as unknown as Record<string, unknown>)
  return result.cid
}

