const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// 允許 Expo 打包器讀取 3D 相關檔案格式
config.resolver.assetExts.push('glb', 'gltf', 'obj', 'mtl', 'png', 'jpg');

module.exports = config;