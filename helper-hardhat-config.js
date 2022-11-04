const { ethers } = require("hardhat")

networkConfig = {
    5: {
        name: "Goerli",
        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
        entryFee: ethers.utils.parseEther("0.1"),
        gasLane:
            "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15", // 30 gwei
        subscriptionId: "6071",
        callbackGasLimit: "500000", // 500,000 gas
        interval: "30",
    },
    31337: {
        name: "hardhat",
        entryFee: ethers.utils.parseEther("0.1"),
        gasLane:
            "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        callbackGasLimit: "500000",
        subscriptionId: "0",
        interval: "30",
    },
}

const developmentChains = ["hardhat", "localhost"]
const VERIFICATION_BLOCK_CONFIRMATIONS = 6

module.exports = {
    networkConfig,
    developmentChains,
    VERIFICATION_BLOCK_CONFIRMATIONS,
}
