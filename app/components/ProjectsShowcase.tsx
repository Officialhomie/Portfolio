'use client'

import { getAllProjects, getFeaturedProjects } from '@/lib/projects-data'
import { ProjectCard } from './ProjectCard'
import { VotingInterface } from './VotingInterface'
import { ProjectSearch } from './ProjectSearch'
import { useState, useMemo } from 'react'
import { Code2, Sparkles, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Project } from '@/types/project'

export function ProjectsShowcase() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const allProjects = getAllProjects()
  const featuredProjects = getFeaturedProjects()

  // Use filtered projects if search/filter is active, otherwise use all projects
  const projects = useMemo(() => {
    return filteredProjects.length > 0 && filteredProjects.length !== allProjects.length
      ? filteredProjects
      : allProjects
  }, [filteredProjects, allProjects])

  // Filter featured projects based on current filter
  const filteredFeaturedProjects = useMemo(() => {
    if (filteredProjects.length > 0 && filteredProjects.length !== allProjects.length) {
      return featuredProjects.filter(fp =>
        filteredProjects.some(p => p.id === fp.id)
      )
    }
    return featuredProjects
  }, [filteredProjects, featuredProjects, allProjects])

  const handleEndorse = (projectId: string) => {
    console.log('Endorse project:', projectId)
  }

  const handleVote = (projectId: string) => {
    setSelectedProject(projectId)
  }

  return (
    <section className="section-lg relative overflow-hidden bg-gradient-to-b from-background via-background-secondary/10 to-background">
      {/* Minimal background decoration */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/[0.02] rounded-full blur-3xl pointer-events-none" />

      <div className="container-wide relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          {/* Badge with icon */}
          <motion.div
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center justify-center gap-2.5 badge badge-primary px-5 py-2.5 mb-8"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Code2 className="h-5 w-5" />
            </motion.div>
            <span className="font-medium">Portfolio Showcase</span>
          </motion.div>

          {/* Main Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl font-mono font-bold gradient-text mb-6"
          >
            Featured Work
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-lg sm:text-xl text-foreground-secondary max-w-3xl mx-auto leading-relaxed text-balance"
          >
            Explore my blockchain projects showcasing smart contract development,
            decentralized storage, and full-stack Web3 engineering
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-8 mt-8"
          >
            <div className="text-center">
              <div className="text-3xl font-mono font-bold gradient-text">{allProjects.length}</div>
              <div className="text-sm text-foreground-secondary">Total Projects</div>
            </div>
            <div className="w-px h-12 bg-glass-border" />
            <div className="text-center">
              <div className="text-3xl font-mono font-bold gradient-text">{featuredProjects.length}</div>
              <div className="text-sm text-foreground-secondary">Featured</div>
            </div>
            <div className="w-px h-12 bg-glass-border" />
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-success">100%</div>
              <div className="text-sm text-foreground-secondary">On-Chain</div>
            </div>
          </motion.div>
        </motion.div>

        {/* Search and Filter - Centered Container */}
        <div className="flex flex-col items-center w-full mb-16 sm:mb-20">
          <ProjectSearch 
            projects={allProjects} 
            onFilterChange={setFilteredProjects}
          />
        </div>

        {/* Featured Projects */}
        {filteredFeaturedProjects.length > 0 && (
          <div className="mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex items-center justify-between mb-12"
            >
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{
                    rotate: [0, 360],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="p-3 rounded-xl bg-gradient-to-br from-secondary/20 to-accent/20 border border-secondary/20"
                >
                  <Sparkles className="h-6 w-6 text-secondary" />
                </motion.div>
                <div>
                  <h3 className="text-3xl sm:text-4xl font-mono font-bold gradient-text">
                    Featured Projects
                  </h3>
                  <p className="text-sm text-foreground-secondary mt-1">
                    Highlighted work showcasing technical excellence
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-2 badge badge-secondary px-4 py-2">
                <span className="font-mono font-bold">{filteredFeaturedProjects.length}</span>
                <span>Featured</span>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredFeaturedProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <ProjectCard
                    project={project}
                    onEndorse={handleEndorse}
                    onVote={handleVote}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* All Projects */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between mb-12"
          >
            <div className="flex items-center gap-4">
              <motion.div
                className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20"
              >
                <Code2 className="h-6 w-6 text-primary" />
              </motion.div>
              <div>
                <h3 className="text-3xl sm:text-4xl font-mono font-bold gradient-text">
                  All Projects
                </h3>
                <p className="text-sm text-foreground-secondary mt-1">
                  Complete portfolio of blockchain solutions
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 badge badge-primary px-4 py-2">
              <span className="font-mono font-bold">{projects.length}</span>
              <span>Total</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <ProjectCard
                  project={project}
                  onEndorse={handleEndorse}
                  onVote={handleVote}
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Voting Interface Modal */}
        <AnimatePresence>
          {selectedProject && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedProject(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-card rounded-2xl p-8 max-w-md w-full relative overflow-hidden"
              >
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl" />

                {/* Close button */}
                <motion.button
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-4 right-4 glass-card p-2 rounded-full hover:bg-opacity-20 transition-all z-10"
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-5 w-5 text-foreground-secondary" />
                </motion.button>

                <div className="relative">
                  <VotingInterface
                    projectId={selectedProject}
                    projectName={projects.find(p => p.id === selectedProject)?.name || ''}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
