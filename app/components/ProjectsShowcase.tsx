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
    <section className="relative py-32 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 overflow-hidden">
      {/* Background decoration - positioned behind content, doesn't affect layout */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-[1920px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center text-center gap-6 sm:gap-8 mb-16 sm:mb-24 px-4"
        >
          {/* Badge with icon */}
          <motion.div
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center justify-center gap-2.5 glass-card px-5 py-2.5 rounded-full"
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            >
              <Code2 className="h-5 w-5 text-primary" />
            </motion.div>
            <span className="text-sm font-mono text-foreground-secondary">Portfolio Showcase</span>
          </motion.div>

          {/* Main Title */}
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-mono font-bold gradient-text">
            Projects
          </h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-base sm:text-lg md:text-xl text-foreground-secondary max-w-3xl leading-relaxed"
          >
            Explore my blockchain projects, each demonstrating different aspects of Web3 development
            from smart contracts to IPFS integration
          </motion.p>

          {/* Animated divider */}
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "120px" }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="h-1 bg-gradient-to-r from-primary via-secondary to-accent rounded-full"
          />
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
          <div className="mb-20 sm:mb-28">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center gap-4 sm:gap-5 mb-12 sm:mb-16"
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
                    ease: "easeInOut",
                  }}
                >
                  <Sparkles className="h-7 w-7 text-secondary" />
                </motion.div>
                <h3 className="text-2xl sm:text-3xl font-mono font-bold gradient-text text-center">
                  Featured Projects
                </h3>
              </div>
              <div className="w-28 h-1 bg-gradient-to-r from-secondary/50 via-secondary to-secondary/50 rounded-full" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 sm:gap-8 lg:gap-10">
              {filteredFeaturedProjects.map((project, index) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEndorse={handleEndorse}
                  onVote={handleVote}
                />
              ))}
            </div>
          </div>
        )}

        {/* All Projects */}
        <div className="mt-8 sm:mt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-4 sm:gap-5 mb-12 sm:mb-16"
          >
            <div className="flex items-center gap-4">
              <h3 className="text-2xl sm:text-3xl font-mono font-bold gradient-text text-center">
                All Projects
              </h3>
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", delay: 0.3 }}
                className="glass-card px-4 py-2 rounded-full"
              >
                <span className="text-sm font-mono text-foreground-secondary">
                  {projects.length} Projects
                </span>
              </motion.div>
            </div>
            <div className="w-28 h-1 bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 sm:gap-8 lg:gap-10">
            {projects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEndorse={handleEndorse}
                onVote={handleVote}
              />
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
