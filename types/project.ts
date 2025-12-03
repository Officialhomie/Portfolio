export interface Project {
  id: string
  name: string
  tagline: string
  description: string
  problemSolved: string
  role: string
  techStack: string[]
  githubUrl: string
  demoUrl?: string
  contractAddress?: string
  ipfsImageCID?: string
  ipfsMetadataCID?: string
  stats: {
    stars?: number
    forks?: number
    contributions?: number
  }
  featured: boolean
}

export interface ProjectMetadata {
  name: string
  description: string
  image: string
  external_url: string
  attributes: Array<{
    trait_type: string
    value: string | number
  }>
}

export interface VisitorSignature {
  address: string
  timestamp: number
  message: string
}

export interface ProjectVote {
  projectId: string
  voter: string
  timestamp: number
}


