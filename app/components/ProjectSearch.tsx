'use client'

import { useState, useMemo, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Project } from '@/types/project'

interface ProjectSearchProps {
  projects: Project[]
  onFilterChange: (filteredProjects: Project[]) => void
}

export function ProjectSearch({ projects, onFilterChange }: ProjectSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Get unique categories from projects
  const categories = useMemo(() => {
    const cats = new Set<string>()
    projects.forEach(project => {
      project.techStack.forEach(tech => cats.add(tech))
    })
    return Array.from(cats).sort()
  }, [projects])

  // Filter projects
  const filteredProjects = useMemo(() => {
    let filtered = projects

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(project =>
        project.name.toLowerCase().includes(query) ||
        project.tagline.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.techStack.some(tech => tech.toLowerCase().includes(query))
      )
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(project =>
        project.techStack.includes(selectedCategory)
      )
    }

    return filtered
  }, [projects, searchQuery, selectedCategory])

  // Notify parent of filtered projects (using useEffect to avoid state update during render)
  useEffect(() => {
    onFilterChange(filteredProjects)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredProjects])

  return (
    <div className="flex flex-col items-center gap-8 sm:gap-10 w-full px-4">
      {/* Search Input */}
      <div className="relative w-full max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-secondary" />
        <input
          type="text"
          placeholder="Search projects by name, description, or technology..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full glass-card rounded-xl pl-12 pr-12 py-4 text-foreground bg-transparent border border-glass-border focus:border-primary focus:outline-none transition-all text-base"
          aria-label="Search projects"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-secondary hover:text-foreground transition-colors p-1 rounded-lg hover:bg-white/5"
            aria-label="Clear search"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2.5 sm:gap-3 justify-center max-w-4xl">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`
            glass-card rounded-lg px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap
            ${selectedCategory === null
              ? 'bg-primary/20 border-primary/50 text-primary'
              : 'border-glass-border text-foreground-secondary hover:text-foreground hover:border-primary/30'
            }
          `}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
            className={`
              glass-card rounded-lg px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap
              ${selectedCategory === category
                ? 'bg-primary/20 border-primary/50 text-primary'
                : 'border-glass-border text-foreground-secondary hover:text-foreground hover:border-primary/30'
              }
            `}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Results Count */}
      <AnimatePresence>
        {(searchQuery || selectedCategory) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-sm text-foreground-secondary text-center glass-card px-4 py-2 rounded-full"
          >
            Found {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

