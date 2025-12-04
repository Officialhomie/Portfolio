'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface BentoGridProps {
  children: ReactNode
  className?: string
}

interface BentoItemProps {
  children: ReactNode
  className?: string
  span?: 'default' | 'wide' | 'tall' | 'large'
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr',
        className
      )}
    >
      {children}
    </div>
  )
}

export function BentoItem({ children, className, span = 'default' }: BentoItemProps) {
  const spanClasses = {
    default: '',
    wide: 'md:col-span-2',
    tall: 'md:row-span-2',
    large: 'md:col-span-2 md:row-span-2',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={cn(
        'relative overflow-hidden',
        spanClasses[span],
        className
      )}
    >
      {children}
    </motion.div>
  )
}
