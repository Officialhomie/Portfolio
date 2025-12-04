'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface BaseLogoProps {
  size?: number
  className?: string
}

export function BaseLogo({ size = 40, className }: BaseLogoProps) {
  return (
    <div
      className={cn(
        'relative rounded-lg overflow-hidden bg-primary/10 border border-primary/20 p-1',
        className
      )}
      style={{ width: size, height: size }}
    >
      <div className="relative w-full h-full">
        {/* Placeholder for Base logo - will be replaced with actual image */}
        <div className="w-full h-full rounded-md bg-primary flex items-center justify-center">
          <span className="text-white font-bold text-xs sm:text-sm">BASE</span>
        </div>
      </div>
    </div>
  )
}
