'use client'

import { getAllProjects, getFeaturedProjects } from '@/lib/projects-data'
import { ProjectCard } from './ProjectCard'
import { VotingInterface } from './VotingInterface'
import { useState } from 'react'
import { Code2, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export function ProjectsShowcase() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const projects = getAllProjects()
  const featuredProjects = getFeaturedProjects()

  const handleEndorse = (projectId: string) => {
    console.log('Endorse project:', projectId)
    // Implement endorsement logic
  }

  const handleVote = (projectId: string) => {
    setSelectedProject(projectId)
    // Voting handled by VotingInterface component
  }

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Code2 className="h-8 w-8 text-primary" />
            <h2 className="text-4xl md:text-5xl font-mono font-bold text-foreground">
              Projects
            </h2>
          </div>
          <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
            Explore my blockchain projects, each demonstrating different aspects of Web3 development
          </p>
        </motion.div>

        {/* Featured Projects */}
        {featuredProjects.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="h-5 w-5 text-secondary" />
              <h3 className="text-2xl font-mono font-bold text-foreground">
                Featured Projects
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
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
          <h3 className="text-2xl font-mono font-bold text-foreground mb-6">
            All Projects
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
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
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="glass rounded-xl p-6 max-w-md w-full"
            >
              <VotingInterface
                projectId={selectedProject}
                projectName={projects.find(p => p.id === selectedProject)?.name || ''}
              />
              <button
                onClick={() => setSelectedProject(null)}
                className="mt-4 w-full glass hover:bg-opacity-20 rounded-lg px-4 py-2 text-foreground-secondary hover:text-foreground transition-all text-sm"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </section>
  )
}


