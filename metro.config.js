const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// zustand's ESM build (esm/*.mjs) uses `import.meta`, which Metro's classic
// (non-module) dev bundles can't execute in the browser. Resolve zustand to
// its CommonJS files via Node's own "require" condition instead.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    return { type: 'sourceFile', filePath: require.resolve(moduleName) };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
