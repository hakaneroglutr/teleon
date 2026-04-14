const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

const config = {
  resolver: {
    extraNodeModules: {
      '@screens':    path.resolve(__dirname, 'src/screens'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@store':      path.resolve(__dirname, 'src/store'),
      '@services':   path.resolve(__dirname, 'src/services'),
      '@native':     path.resolve(__dirname, 'src/native'),
      '@navigation': path.resolve(__dirname, 'src/navigation'),
      '@theme':      path.resolve(__dirname, 'src/theme'),
      '@utils':      path.resolve(__dirname, 'src/utils'),
      '@hooks':      path.resolve(__dirname, 'src/hooks'),
      '@config':     path.resolve(__dirname, 'src/config'),
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
