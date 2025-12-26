import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Ensure we use src/app directory, not root app directory
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  typescript: {
    ignoreBuildErrors: false,
  },
  // Exclude problematic packages from server components
  serverExternalPackages: [
    'thread-stream',
    'why-is-node-running',
    '@walletconnect/ethereum-provider',
    'pino',
    'pino-pretty',
    'lokijs',
    'encoding',
    '@privy-io/react-auth',
    '@reown/appkit',
    '@walletconnect/universal-provider',
    '@walletconnect/logger',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ipfs.io',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
      },
    ],
  },
  // Turbopack configuration (for dev and production builds in Next.js 16)
  turbopack: {
    resolveAlias: {
      '@react-native-async-storage/async-storage': './src/lib/utils/noop.ts',
      'why-is-node-running': './src/lib/utils/noop.ts',
    },
    rules: {
      // Exclude test files from bundling
      '*/node_modules/**/*.test.{js,ts,mjs}': {
        loaders: [],
        as: '*.js',
      },
      '*/node_modules/**/test/**': {
        loaders: [],
        as: '*.js',
      },
    },
  },
  // Webpack configuration (for production build)
  webpack: (config, { isServer }) => {
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false,
      '@react-native-async-storage/async-storage': false,
      'why-is-node-running': false,
    };
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    
    // Ignore React Native modules in browser builds
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': false,
        'why-is-node-running': false,
      };
    }
    
    // Exclude test files from bundling
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /\.(test|spec)\.(js|ts|mjs)$/,
      use: 'ignore-loader',
    });
    
    // Ignore test directories in node_modules
    config.resolve.alias = {
      ...config.resolve.alias,
      'thread-stream/test/helper': false,
    };
    
    return config;
  },
  // Suppress browser extension errors in console
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
