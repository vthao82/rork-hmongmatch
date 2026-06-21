const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");

const config = getDefaultConfig(__dirname);

// Bind to all network interfaces so the sandbox proxy can reach Metro
config.server = { ...config.server, host: "0.0.0.0", port: 19999 };

module.exports = withRorkMetro(config);
