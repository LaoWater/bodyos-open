// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ensure .mov video files are handled as assets (uppercase/lowercase variants)
config.resolver.assetExts.push('mov', 'MOV');

module.exports = config;
