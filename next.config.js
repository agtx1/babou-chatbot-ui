const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  reactStrictMode: true,

  webpack(config, { isServer, dev }) {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };
    config.unstable_allowDynamic = ['node_modules/underscore/modules/template.js','node_modules/underscore/modules/_setup.js'];

    return config;
  },
};

module.exports = nextConfig;
