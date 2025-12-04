'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-xl p-8 max-w-md mx-auto mt-8 border border-accent/30"
        >
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 rounded-full bg-accent/10">
              <AlertTriangle className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-mono font-bold text-foreground mb-2">
                Something went wrong
              </h3>
              <p className="text-sm text-foreground-secondary mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="glass-card hover:bg-opacity-20 rounded-lg px-6 py-2 flex items-center gap-2 text-primary hover:text-primary-hover transition-all"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Try again</span>
            </button>
          </div>
        </motion.div>
      )
    }

    return this.props.children
  }
}

