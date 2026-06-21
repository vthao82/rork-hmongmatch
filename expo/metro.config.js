const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");

const config = getDefaultConfig(__dirname);

// Bind to all network interfaces and use the user's local IP for QR code
config.server = {
  ...config.server,
  host: '0.0.0.0',
  port: 8081,
};

module.exports = withRorkMetro(config);
