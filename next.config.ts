import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Ignore test files and other unnecessary files from node_modules (both server and client)
    config.plugins = config.plugins || [];
    
    // Use require to get webpack at runtime
    const webpack = require('webpack');
    
    // Ignore test directories
    config.plugins.push(
      new webpack.IgnorePlugin({
        checkResource(resource: string) {
          // Ignore any file in a test directory within node_modules
          if (resource.includes('node_modules') && resource.includes('/test/')) {
            return true;
          }
          // Ignore test files
          if (resource.includes('node_modules') && /\.(test|spec)\.(js|ts|mjs)$/.test(resource)) {
            return true;
          }
          // Ignore benchmark files
          if (resource.includes('node_modules') && resource.includes('bench.js')) {
            return true;
          }
          return false;
        },
      })
    );
    
    if (isServer) {
      // On server, completely ignore electron-fetch and ipfs-http-client to prevent SSR issues
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(ipfs-http-client|electron-fetch)$/,
        })
      );
    }
    
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        electron: false,
      };
    }
    // Ignore pino-pretty and other optional dependencies
    config.externals = config.externals || [];
    if (Array.isArray(config.externals)) {
      config.externals.push({
        'pino-pretty': 'commonjs pino-pretty',
        'why-is-node-running': 'commonjs why-is-node-running',
        '@react-native-async-storage/async-storage': 'commonjs @react-native-async-storage/async-storage',
        'electron': 'commonjs electron',
        'tap': 'commonjs tap',
        'tape': 'commonjs tape',
        'desm': 'commonjs desm',
        'fastbench': 'commonjs fastbench',
        'pino-elasticsearch': 'commonjs pino-elasticsearch',
      });
    } else {
      config.externals = [
        config.externals,
        {
          'pino-pretty': 'commonjs pino-pretty',
          'why-is-node-running': 'commonjs why-is-node-running',
          '@react-native-async-storage/async-storage': 'commonjs @react-native-async-storage/async-storage',
          'electron': 'commonjs electron',
          'tap': 'commonjs tap',
          'tape': 'commonjs tape',
          'desm': 'commonjs desm',
          'fastbench': 'commonjs fastbench',
          'pino-elasticsearch': 'commonjs pino-elasticsearch',
        },
      ];
    }
    return config;
  },
  // Use serverExternalPackages to exclude problematic packages from server bundle
  serverExternalPackages: ['pino', 'thread-stream'],
};

export default nextConfig;
