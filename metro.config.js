// metro.config.js
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const config = {
  resolver: {
    alias: {
      '@screens':    './src/screens',
      '@components': './src/components',
      '@store':      './src/store',
      '@services':   './src/services',
      '@native':     './src/native',
      '@navigation': './src/navigation',
      '@theme':      './src/theme',
      '@utils':      './src/utils',
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
