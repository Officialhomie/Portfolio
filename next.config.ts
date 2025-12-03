import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    config.plugins = config.plugins || [];
    const webpack = require('webpack');

    // Ignore test directories
    config.plugins.push(
      new webpack.IgnorePlugin({
        checkResource(resource: string) {
          if (resource.includes('node_modules') && resource.includes('/test/')) {
            return true;
          }
          if (resource.includes('node_modules') && /\.(test|spec)\.(js|ts|mjs)$/.test(resource)) {
            return true;
          }
          if (resource.includes('node_modules') && resource.includes('bench.js')) {
            return true;
          }
          return false;
        },
      })
    );

    // Ignore optional wallet connector dependencies
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(@coinbase\/wallet-sdk|@metamask\/sdk|@base-org\/account|@gemini-wallet\/core|porto|@safe-global\/safe-apps-sdk|@safe-global\/safe-apps-provider|@walletconnect\/ethereum-provider)$/,
      })
    );

    if (isServer) {
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

    config.externals = config.externals || [];
    const externalDeps = {
      'pino-pretty': 'commonjs pino-pretty',
      'why-is-node-running': 'commonjs why-is-node-running',
      '@react-native-async-storage/async-storage': 'commonjs @react-native-async-storage/async-storage',
      'electron': 'commonjs electron',
      'tap': 'commonjs tap',
      'tape': 'commonjs tape',
      'desm': 'commonjs desm',
      'fastbench': 'commonjs fastbench',
      'pino-elasticsearch': 'commonjs pino-elasticsearch',
    };

    if (Array.isArray(config.externals)) {
      config.externals.push(externalDeps);
    } else {
      config.externals = [config.externals, externalDeps];
    }

    return config;
  },
  serverExternalPackages: ['pino', 'thread-stream'],
};

export default nextConfig;
