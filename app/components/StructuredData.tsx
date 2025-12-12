'use client'

import { getAllProjects } from '@/lib/projects-data'

export function StructuredData() {
  const projects = getAllProjects()
  
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'OneTrueHomie',
    jobTitle: 'Full-Stack Blockchain Developer',
    description: 'Full-stack blockchain developer specializing in Web3, smart contracts, and decentralized applications.',
    url: typeof window !== 'undefined' ? window.location.origin : '',
    sameAs: [
      'https://github.com/Officialhomie',
      'https://twitter.com/Officialhomie',
      'https://linkedin.com/in/officialhomie',
    ],
    knowsAbout: [
      'Web3',
      'Blockchain',
      'Solidity',
      'Smart Contracts',
      'DeFi',
      'NFT',
      'Next.js',
      'React',
      'TypeScript',
    ],
    hasOccupation: {
      '@type': 'Occupation',
      name: 'Full-Stack Blockchain Developer',
      occupationLocation: {
        '@type': 'Place',
        name: 'Base',
      },
    },
    hasCredential: projects.map(project => ({
      '@type': 'CreativeWork',
      name: project.name,
      description: project.tagline,
      url: project.githubUrl || project.demoUrl,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}

