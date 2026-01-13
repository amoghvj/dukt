// Test fixture config - loads the plugin from parent directory
// IMPORTANT: Dukt must load BEFORE hardhat-ethers to wrap the provider first
require("../dist/index.js");
require("@nomicfoundation/hardhat-ethers");

module.exports = {
    solidity: "0.8.19",
    dukt: {
        enabled: true,
    },
    networks: {
        hardhat: {
            // Using the default in-memory Hardhat network
        },
    },
};
