'use client'

import { Project } from '@/types/project'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { ExternalLink, Github, Code, Image as ImageIcon, CheckCircle2 } from 'lucide-react'
import { formatAddress, getBaseScanURL } from '@/lib/utils'
import { getIPFSGatewayURL } from '@/lib/projects-data'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
  project: Project
  onEndorse?: (projectId: string) => void
  onVote?: (projectId: string) => void
}

export function ProjectCard({ project, onEndorse, onVote }: ProjectCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const imageUrl = project.ipfsImageCID 
    ? getIPFSGatewayURL(project.ipfsImageCID)
    : '/placeholder-project.png'

  return (
    <div className="relative h-[400px] perspective-1000">
      <motion.div
        className="relative w-full h-full preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front of card */}
        <div
          className={cn(
            "absolute inset-0 backface-hidden glass rounded-xl p-6 cursor-pointer",
            "hover:border-primary/50 transition-all"
          )}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="flex flex-col h-full">
            {/* Project Image */}
            <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-800">
              {project.ipfsImageCID ? (
                <img
                  src={imageUrl}
                  alt={project.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-project.png'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-foreground-secondary" />
                </div>
              )}
              {project.featured && (
                <div className="absolute top-2 right-2">
                  <div className="glass px-2 py-1 rounded text-xs font-mono text-secondary flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Featured
                  </div>
                </div>
              )}
            </div>

            {/* Project Info */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-xl font-mono font-bold text-foreground mb-2">
                {project.name}
              </h3>
              <p className="text-sm text-foreground-secondary mb-4 line-clamp-2">
                {project.tagline}
              </p>

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-2 mb-4">
                {project.techStack.slice(0, 3).map((tech) => (
                  <span
                    key={tech}
                    className="text-xs px-2 py-1 rounded glass text-foreground-secondary"
                  >
                    {tech}
                  </span>
                ))}
                {project.techStack.length > 3 && (
                  <span className="text-xs px-2 py-1 rounded glass text-foreground-secondary">
                    +{project.techStack.length - 3}
                  </span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-auto text-xs text-foreground-secondary">
                {project.stats.stars !== undefined && (
                  <span>⭐ {project.stats.stars}</span>
                )}
                {project.stats.forks !== undefined && (
                  <span>🍴 {project.stats.forks}</span>
                )}
              </div>
            </div>

            {/* Flip hint */}
            <div className="mt-4 text-xs text-center text-foreground-secondary">
              Click to flip
            </div>
          </div>
        </div>

        {/* Back of card */}
        <div
          className={cn(
            "absolute inset-0 backface-hidden rotate-y-180 glass rounded-xl p-6 overflow-y-auto",
            "hover:border-primary/50 transition-all"
          )}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="flex flex-col h-full">
            <h3 className="text-xl font-mono font-bold text-foreground mb-4">
              {project.name}
            </h3>

            <div className="space-y-4 flex-1">
              <div>
                <h4 className="text-sm font-mono text-primary mb-1">Description</h4>
                <p className="text-sm text-foreground-secondary">{project.description}</p>
              </div>

              <div>
                <h4 className="text-sm font-mono text-primary mb-1">Problem Solved</h4>
                <p className="text-sm text-foreground-secondary">{project.problemSolved}</p>
              </div>

              <div>
                <h4 className="text-sm font-mono text-primary mb-1">My Role</h4>
                <p className="text-sm text-foreground-secondary">{project.role}</p>
              </div>

              {project.contractAddress && (
                <div>
                  <h4 className="text-sm font-mono text-primary mb-1">Contract</h4>
                  <a
                    href={getBaseScanURL(project.contractAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline font-mono"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {formatAddress(project.contractAddress)}
                  </a>
                </div>
              )}

              {project.ipfsMetadataCID && (
                <div>
                  <h4 className="text-sm font-mono text-primary mb-1">IPFS Metadata</h4>
                  <a
                    href={getIPFSGatewayURL(project.ipfsMetadataCID)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline font-mono break-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {project.ipfsMetadataCID.slice(0, 20)}...
                  </a>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 mt-4">
              <div className="flex gap-2">
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 glass hover:bg-opacity-20 rounded-lg px-4 py-2 flex items-center justify-center gap-2 text-foreground-secondary hover:text-foreground transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Github className="h-4 w-4" />
                    <span className="text-sm">GitHub</span>
                  </a>
                )}
                {project.demoUrl && (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 glass hover:bg-opacity-20 rounded-lg px-4 py-2 flex items-center justify-center gap-2 text-foreground-secondary hover:text-foreground transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="text-sm">Demo</span>
                  </a>
                )}
              </div>

              {onEndorse && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEndorse(project.id)
                  }}
                  className="glass hover:bg-opacity-20 rounded-lg px-4 py-2 text-primary hover:text-primary-hover transition-all text-sm font-medium"
                >
                  Endorse Project
                </button>
              )}

              {onVote && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onVote(project.id)
                  }}
                  className="glass hover:bg-opacity-20 rounded-lg px-4 py-2 text-secondary hover:text-secondary-hover transition-all text-sm font-medium"
                >
                  Vote for Project
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}


