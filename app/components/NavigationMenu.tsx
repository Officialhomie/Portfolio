'use client'

import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Menu, X, Home, FolderGit2, Zap, Mail } from 'lucide-react'
import { WalletConnect } from './WalletConnect'
import { BaseLogo } from './BaseLogo'
import { useAppKitAccount } from '@reown/appkit/react'

const navItems = [
  { label: 'Home', href: '#home', icon: Home },
  { label: 'Projects', href: '#projects', icon: FolderGit2 },
  { label: 'Interactive', href: '#interactive', icon: Zap },
  { label: 'Contact', href: '#contact', icon: Mail },
]

export function NavigationMenu() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const { isConnected } = useAppKitAccount()
  const { scrollY } = useScroll()

  // Transform values for scroll effects
  const headerBg = useTransform(
    scrollY,
    [0, 100],
    ['rgba(10, 10, 20, 0)', 'rgba(10, 10, 20, 0.8)']
  )
  const headerBlur = useTransform(scrollY, [0, 100], ['blur(0px)', 'blur(24px)'])
  const headerShadow = useTransform(
    scrollY,
    [0, 100],
    ['0 0 0 0 rgba(0, 0, 0, 0)', '0 4px 24px 0 rgba(0, 0, 0, 0.3)']
  )

  useEffect(() => {
    const handleScroll = () => {
      const sections = navItems.map((item) => item.href.slice(1))
      const current = sections.find((section) => {
        const element = document.getElementById(section)
        if (element) {
          const rect = element.getBoundingClientRect()
          return rect.top <= 100 && rect.bottom >= 100
        }
        return false
      })
      if (current) setActiveSection(current)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (href: string) => {
    const element = document.getElementById(href.slice(1))
    if (element) {
      const offset = 80
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - offset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      })
    }
    setIsMobileMenuOpen(false)
  }

  return (
    <>
      {/* Main Navigation Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: headerBg,
          backdropFilter: headerBlur,
          WebkitBackdropFilter: headerBlur,
          boxShadow: headerShadow,
        }}
      >
        <div className="border-b border-glass-border">
          <div className="container-wide">
            <div className="flex items-center justify-between h-20">
              {/* Logo */}
              <motion.a
                href="#home"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToSection('#home')
                }}
                className="flex items-center gap-3 group cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <BaseLogo size={48} />
                <div className="hidden sm:block">
                  <h1 className="font-mono font-bold text-lg text-foreground">
                    OneTrueHomie
                  </h1>
                  <p className="text-xs text-foreground-secondary">
                    Full-Stack Web3 Developer
                  </p>
                </div>
              </motion.a>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-2">
                {navItems.map((item) => {
                  const isActive = activeSection === item.href.slice(1)
                  const Icon = item.icon
                  return (
                    <motion.a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault()
                        scrollToSection(item.href)
                      }}
                      className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                        isActive
                          ? 'text-foreground'
                          : 'text-foreground-secondary hover:text-foreground'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute inset-0 bg-glass-bg rounded-xl border border-glass-border"
                          transition={{
                            type: 'spring',
                            stiffness: 380,
                            damping: 30,
                          }}
                        />
                      )}
                      <Icon className="h-4 w-4 relative z-10" />
                      <span className="relative z-10">{item.label}</span>
                    </motion.a>
                  )
                })}
              </nav>

              {/* Wallet Connect & Mobile Menu */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:block">
                  <WalletConnect />
                </div>

                {/* Mobile Menu Button */}
                <motion.button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="lg:hidden glass-card p-2 rounded-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Toggle menu"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6 text-foreground" />
                  ) : (
                    <Menu className="h-6 w-6 text-foreground" />
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Connection Status Indicator */}
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden sm:flex items-center justify-center py-1.5 px-4 text-xs text-success border-t border-glass-border bg-glass-bg"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span className="font-medium">Connected to Base</span>
            </div>
          </motion.div>
        )}
      </motion.header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="absolute top-0 right-0 bottom-0 w-80 max-w-full glass-card border-l border-glass-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full p-6">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="font-mono font-bold text-lg gradient-text">
                  Menu
                </h2>
                <motion.button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="glass-card p-2 rounded-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="h-5 w-5 text-foreground" />
                </motion.button>
              </div>

              {/* Mobile Navigation Links */}
              <nav className="flex flex-col gap-2 mb-8">
                {navItems.map((item, index) => {
                  const isActive = activeSection === item.href.slice(1)
                  const Icon = item.icon
                  return (
                    <motion.a
                      key={item.href}
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault()
                        scrollToSection(item.href)
                      }}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                        isActive
                          ? 'bg-glass-bg border border-glass-border text-foreground'
                          : 'text-foreground-secondary hover:text-foreground hover:bg-glass-bg'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                      {isActive && (
                        <motion.div
                          layoutId="activeMobileNav"
                          className="ml-auto w-2 h-2 rounded-full bg-primary"
                        />
                      )}
                    </motion.a>
                  )
                })}
              </nav>

              {/* Mobile Wallet Connect */}
              <div className="mt-auto pt-6 border-t border-glass-border">
                <WalletConnect />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  )
}
