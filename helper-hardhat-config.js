const { ethers } = require("hardhat")

networkConfig = {
    4: {
        name: "rinkeby",
        vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
        entryFee: ethers.utils.parseEther("0.01"),
        gasLane:
            "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", // 30 gwei
        subscriptionId: "20782",
        callbackGasLimit: "500000", // 500,000 gas
        interval: "30",
    },
    31337: {
        name: "hardhat",
        entryFee: ethers.utils.parseEther("0.01"),
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
