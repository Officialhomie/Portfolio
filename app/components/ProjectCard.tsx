'use client'

import { Project } from '@/types/project'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { ExternalLink, Github, Image as ImageIcon, CheckCircle2, Star, GitFork } from 'lucide-react'
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
  const [imageLoaded, setImageLoaded] = useState(false)

  const imageUrl = project.ipfsImageCID
    ? getIPFSGatewayURL(project.ipfsImageCID)
    : '/placeholder-project.png'

  return (
    <motion.div
      className="relative h-[480px] perspective-1000 group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{ willChange: 'transform' }}
    >
      <motion.div
        className="relative w-full h-full preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        {/* Front of card */}
        <motion.div
          className={cn(
            "absolute inset-0 backface-hidden glass-card rounded-xl p-6 cursor-pointer overflow-hidden"
          )}
          onClick={() => setIsFlipped(!isFlipped)}
          style={{ willChange: 'transform' }}
        >
          {/* Animated border gradient */}
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary via-secondary to-accent opacity-20 blur-xl" />
          </div>

          <div className="relative flex flex-col h-full">
            {/* Project Image */}
            <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gray-900/50">
              {project.ipfsImageCID ? (
                <>
                  {!imageLoaded && (
                    <div className="absolute inset-0 skeleton" />
                  )}
                  <motion.img
                    src={imageUrl}
                    alt={project.name}
                    className={cn(
                      "w-full h-full object-cover transition-opacity duration-500",
                      imageLoaded ? "opacity-100" : "opacity-0"
                    )}
                    onLoad={() => setImageLoaded(true)}
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-project.png'
                      setImageLoaded(true)
                    }}
                    style={{ pointerEvents: 'none' }}
                  />
                  {/* Image overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <ImageIcon className="h-12 w-12 text-foreground-secondary" />
                  </motion.div>
                </div>
              )}

              {/* Featured badge */}
              {project.featured && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", delay: 0.2 }}
                  className="absolute top-2 right-2"
                >
                  <div className="glass-card px-3 py-1.5 rounded-full text-xs font-mono text-secondary flex items-center gap-1.5 shadow-lg">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </motion.div>
                    Featured
                  </div>
                </motion.div>
              )}
            </div>

            {/* Project Info */}
            <div className="flex-1 flex flex-col">
              <h3 className="text-xl font-mono font-bold text-foreground mb-2 gradient-text">
                {project.name}
              </h3>
              <p className="text-sm text-foreground-secondary mb-4 line-clamp-2 leading-relaxed">
                {project.tagline}
              </p>

              {/* Tech Stack */}
              <div className="flex flex-wrap gap-2 mb-4">
                {project.techStack.slice(0, 3).map((tech, i) => (
                  <motion.span
                    key={tech}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="text-xs px-3 py-1.5 rounded-full glass border border-primary/20 text-foreground-secondary hover:text-foreground hover:border-primary/50 transition-all"
                  >
                    {tech}
                  </motion.span>
                ))}
                {project.techStack.length > 3 && (
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    className="text-xs px-3 py-1.5 rounded-full glass border border-secondary/20 text-foreground-secondary hover:text-foreground hover:border-secondary/50 transition-all"
                  >
                    +{project.techStack.length - 3}
                  </motion.span>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mt-auto text-sm text-foreground-secondary">
                {project.stats.stars !== undefined && (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="flex items-center gap-1.5"
                  >
                    <Star className="h-4 w-4 text-secondary" />
                    <span>{project.stats.stars}</span>
                  </motion.div>
                )}
                {project.stats.forks !== undefined && (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="flex items-center gap-1.5"
                  >
                    <GitFork className="h-4 w-4 text-primary" />
                    <span>{project.stats.forks}</span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Flip hint with animation */}
            <motion.div
              className="mt-4 text-xs text-center text-foreground-secondary flex items-center justify-center gap-2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-primary" />
                <div className="w-1 h-1 rounded-full bg-secondary" />
                <div className="w-1 h-1 rounded-full bg-accent" />
              </div>
              <span>Click to flip</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Back of card */}
        <motion.div
          className={cn(
            "absolute inset-0 backface-hidden rotate-y-180 glass-card rounded-xl p-6 overflow-y-auto cursor-pointer"
          )}
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <div className="flex flex-col h-full">
            <motion.h3
              initial={{ opacity: 0 }}
              animate={{ opacity: isFlipped ? 1 : 0 }}
              transition={{ delay: isFlipped ? 0.3 : 0 }}
              className="text-xl font-mono font-bold gradient-text mb-4"
            >
              {project.name}
            </motion.h3>

            <div className="space-y-4 flex-1">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: isFlipped ? 1 : 0, x: isFlipped ? 0 : -20 }}
                transition={{ delay: isFlipped ? 0.4 : 0 }}
              >
                <h4 className="text-sm font-mono text-primary mb-1.5 flex items-center gap-2">
                  <div className="w-1 h-4 bg-primary rounded-full" />
                  Description
                </h4>
                <p className="text-sm text-foreground-secondary leading-relaxed pl-3">
                  {project.description}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: isFlipped ? 1 : 0, x: isFlipped ? 0 : -20 }}
                transition={{ delay: isFlipped ? 0.5 : 0 }}
              >
                <h4 className="text-sm font-mono text-secondary mb-1.5 flex items-center gap-2">
                  <div className="w-1 h-4 bg-secondary rounded-full" />
                  Problem Solved
                </h4>
                <p className="text-sm text-foreground-secondary leading-relaxed pl-3">
                  {project.problemSolved}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: isFlipped ? 1 : 0, x: isFlipped ? 0 : -20 }}
                transition={{ delay: isFlipped ? 0.6 : 0 }}
              >
                <h4 className="text-sm font-mono text-accent mb-1.5 flex items-center gap-2">
                  <div className="w-1 h-4 bg-accent rounded-full" />
                  My Role
                </h4>
                <p className="text-sm text-foreground-secondary leading-relaxed pl-3">
                  {project.role}
                </p>
              </motion.div>

              {project.contractAddress && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: isFlipped ? 1 : 0, x: isFlipped ? 0 : -20 }}
                  transition={{ delay: isFlipped ? 0.7 : 0 }}
                  className="glass px-3 py-2 rounded-lg"
                >
                  <h4 className="text-xs font-mono text-primary mb-1">Contract Address</h4>
                  <a
                    href={getBaseScanURL(project.contractAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground font-mono hover:text-primary transition-colors flex items-center gap-2 group"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>{formatAddress(project.contractAddress)}</span>
                    <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </a>
                </motion.div>
              )}

              {project.ipfsMetadataCID && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: isFlipped ? 1 : 0, x: isFlipped ? 0 : -20 }}
                  transition={{ delay: isFlipped ? 0.8 : 0 }}
                  className="glass px-3 py-2 rounded-lg"
                >
                  <h4 className="text-xs font-mono text-secondary mb-1">IPFS Metadata</h4>
                  <a
                    href={getIPFSGatewayURL(project.ipfsMetadataCID)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-foreground font-mono hover:text-secondary transition-colors flex items-center gap-2 group break-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>{project.ipfsMetadataCID.slice(0, 20)}...</span>
                    <ExternalLink className="h-3 w-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform flex-shrink-0" />
                  </a>
                </motion.div>
              )}
            </div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isFlipped ? 1 : 0, y: isFlipped ? 0 : 20 }}
              transition={{ delay: isFlipped ? 0.9 : 0 }}
              className="flex flex-col gap-2 mt-4"
            >
              <div className="grid grid-cols-2 gap-2">
                {project.githubUrl && (
                  <motion.a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card hover:bg-opacity-20 rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 text-foreground-secondary hover:text-foreground transition-all btn-glow"
                    onClick={(e) => e.stopPropagation()}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Github className="h-4 w-4" />
                    <span className="text-sm font-medium">GitHub</span>
                  </motion.a>
                )}
                {project.demoUrl && (
                  <motion.a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="glass-card hover:bg-opacity-20 rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 text-foreground-secondary hover:text-foreground transition-all btn-glow"
                    onClick={(e) => e.stopPropagation()}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span className="text-sm font-medium">Demo</span>
                  </motion.a>
                )}
              </div>

              {onEndorse && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEndorse(project.id)
                  }}
                  className="glass-card hover:bg-opacity-20 rounded-lg px-4 py-2.5 text-primary hover:text-primary-hover transition-all text-sm font-medium btn-glow"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Endorse Project
                </motion.button>
              )}

              {onVote && (
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation()
                    onVote(project.id)
                  }}
                  className="glass-card hover:bg-opacity-20 rounded-lg px-4 py-2.5 text-secondary hover:text-secondary-hover transition-all text-sm font-medium btn-glow"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Vote for Project
                </motion.button>
              )}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
