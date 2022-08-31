const { assert, expect } = require("chai")
const { ethers, deployments, network } = require("hardhat")
const {
    networkConfig,
    developmentChains,
} = require("../../helper-hardhat-config")

developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery Unit Tests", function () {
          let lottery, lotteryEntryFee, deployer

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              lottery = await ethers.getContract("Lottery", deployer)
              lotteryEntryFee = await lottery.getEntryFee()
          })
          it("will work with Chainlink keepers and VRF, we get a random winner", async function () {
              // enter lottery
              const startingTimeStamp = await lottery.getLastTimeStamp()
              const accounts = await ethers.getSigners()
              console.log("Setting Up Listener...")
              await new Promise(async (resolve, reject) => {
                  // setting up the listner
                  // in case the blockchain moves faster
                  lottery.once("WinnerPicked", async () => {
                      console.log("Event Fired!")

                      try {
                          // asserts
                          const recentWinner = await lottery.getRecentWinner()
                          console.log(recentWinner)
                          const winnerEndingBalance =
                              await accounts[0].getBalance()
                          const lotteryState = await lottery.getLotteryState()
                          const endingTimeStamp =
                              await lottery.getLastTimeStamp()

                          await expect(lottery.getPlayers(0)).to.be.reverted

                          assert.equal(
                              recentWinner.toString(),
                              accounts[0].address
                          )

                          assert.equal(lotteryState, 0)
                          assert.equal(
                              winnerEndingBalance.toString(),
                              startingBalance.add(lotteryEntryFee).toString()
                          )
                          assert(startingTimeStamp < endingTimeStamp)

                          resolve()
                      } catch (error) {
                          console.log(error)
                          reject(error)
                      }
                  })
                  // entering the lottery
                  await lottery.enterLottery({ value: lotteryEntryFee })
                  const startingBalance = await accounts[0].getBalance()
                  // and this code wont Complete until listener finishes listening
              })
          })
      })
