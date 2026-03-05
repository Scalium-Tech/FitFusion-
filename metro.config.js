const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
    // Adds support for `.bin` files for TensorFlow machine learning models
    'bin'
);

module.exports = config;
