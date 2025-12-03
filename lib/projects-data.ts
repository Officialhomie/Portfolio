import { Project } from '@/types/project'

/**
 * Get IPFS gateway URL (simple utility, no client needed)
 */
export function getIPFSGatewayURL(cid: string): string {
  return `https://ipfs.io/ipfs/${cid}`
}

/**
 * Sample project data - will be populated with actual project data
 * This serves as a template and placeholder
 */
export const sampleProjects: Project[] = [
  {
    id: 'healthtrove',
    name: 'HealthTrove',
    tagline: 'Decentralized Healthcare Management System',
    description: 'A decentralized, on-chain healthcare management system designed to improve patient records management, appointment scheduling, and data privacy in the healthcare sector. Built on the Base network.',
    problemSolved: 'Inefficient healthcare data management, lack of patient data privacy, and overcrowded hospital systems in regions like Nigeria.',
    role: 'Full-Stack Blockchain Developer - Smart contracts, IPFS integration, frontend development',
    techStack: ['Solidity', 'Base Network', 'React', 'Vite', 'IPFS', 'Wagmi', 'Viem', 'Pinata'],
    githubUrl: 'https://github.com/Officialhomie/HealthTrove',
    demoUrl: 'https://health-trove.vercel.app',
    contractAddress: '', // Will be populated after deployment
    ipfsImageCID: '',
    ipfsMetadataCID: '',
    stats: {
      stars: 1,
      forks: 2,
    },
    featured: true,
  },
  {
    id: 'multisig-wallet',
    name: 'MultiSig Wallet',
    tagline: 'Secure Multi-Signature Wallet',
    description: 'A secure multi-signature wallet implementation allowing multiple parties to control funds with customizable approval thresholds.',
    problemSolved: 'Single point of failure in wallet security, need for shared control over funds.',
    role: 'Smart Contract Developer - Contract architecture, security, testing',
    techStack: ['Solidity', 'TypeScript', 'Foundry'],
    githubUrl: 'https://github.com/Officialhomie/MultiSig-Wallet',
    demoUrl: '',
    contractAddress: '',
    ipfsImageCID: '',
    ipfsMetadataCID: '',
    stats: {
      stars: 1,
    },
    featured: true,
  },
  {
    id: 'ifindr',
    name: 'iFindr',
    tagline: 'Decentralized Search Platform',
    description: 'A decentralized search and discovery platform built with Web3 technologies.',
    problemSolved: 'Centralized search engines, data privacy concerns.',
    role: 'Full-Stack Developer',
    techStack: ['TypeScript', 'React', 'Web3'],
    githubUrl: 'https://github.com/Officialhomie/iFindr',
    demoUrl: '',
    contractAddress: '',
    ipfsImageCID: '',
    ipfsMetadataCID: '',
    stats: {
      stars: 1,
    },
    featured: false,
  },
  {
    id: 'decentralized-school-tree',
    name: 'Decentralized School Tree',
    tagline: 'Blockchain-Based Educational Platform',
    description: 'Ethereum-based platform for educational institutions to manage student enrollment, attendance, and program administration with transparent financial tracking. Features NFT certificates and revenue sharing.',
    problemSolved: 'Lack of transparency in educational administration, inefficient record management.',
    role: 'Blockchain Developer - Smart contracts, NFT implementation, frontend',
    techStack: ['Solidity', 'Ethereum', 'NFTs', 'IPFS'],
    githubUrl: 'https://github.com/Officialhomie/Decentralized-School-Tree',
    demoUrl: '',
    contractAddress: '',
    ipfsImageCID: '',
    ipfsMetadataCID: '',
    stats: {},
    featured: true,
  },
  {
    id: 'dex-dapp-next',
    name: 'DEX DApp',
    tagline: 'Decentralized Exchange',
    description: 'A decentralized exchange (DEX) application built with Next.js and Web3 technologies.',
    problemSolved: 'Centralized exchange limitations, need for decentralized trading.',
    role: 'Full-Stack Developer - DEX logic, UI/UX, Web3 integration',
    techStack: ['TypeScript', 'Next.js', 'Web3', 'DeFi'],
    githubUrl: 'https://github.com/Officialhomie/dex-DAPP-next',
    demoUrl: '',
    contractAddress: '',
    ipfsImageCID: '',
    ipfsMetadataCID: '',
    stats: {},
    featured: false,
  },
]

/**
 * Get all projects
 */
export function getAllProjects(): Project[] {
  return sampleProjects
}

/**
 * Get featured projects
 */
export function getFeaturedProjects(): Project[] {
  return sampleProjects.filter(p => p.featured)
}

/**
 * Get project by ID
 */
export function getProjectById(id: string): Project | undefined {
  return sampleProjects.find(p => p.id === id)
}

