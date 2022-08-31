const { assert, expect } = require("chai")
const { ethers, deployments, network } = require("hardhat")
const {
    networkConfig,
    developmentChains,
} = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Lottery Unit Tests", function () {
          let lottery, vrfCoordinatorV2Mock, lotteryEntryFee, deployer, interval
          const chainId = network.config.chainId

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              lottery = await ethers.getContract("Lottery", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract(
                  "VRFCoordinatorV2Mock",
                  deployer
              )
              lotteryEntryFee = await lottery.getEntryFee()
              interval = await lottery.getInterval()
          })
          describe("constructor", function () {
              it("initializes the lottery correctly ", async function () {
                  const lotteryState = await lottery.getLotteryState()
                  const lotteryInterval = await lottery.getInterval()
                  assert.equal(lotteryState.toString(), "0")
                  assert.equal(
                      lotteryInterval.toString(),
                      networkConfig[chainId]["interval"]
                  )
              })
          })
          describe("Entry Fee", function () {
              it("reverts if you dont pay enought eth", async function () {
                  await expect(lottery.enterLottery()).to.be.revertedWith(
                      "Lottery__NotEnoughEthToEnter"
                  )
              })
              it("records players when they enter", async function () {
                  await lottery.enterLottery({ value: lotteryEntryFee })
                  const playerFormContract = await lottery.getPlayers(0)
                  assert.equal(playerFormContract, deployer)
              })
              it("emits an event", async function () {
                  await expect(
                      lottery.enterLottery({ value: lotteryEntryFee })
                  ).to.emit(lottery, "LotteryEnter")
              })
              it("doesnt allow to enter when lottery is calculating", async function () {
                  await lottery.enterLottery({ value: lotteryEntryFee })
                  await network.provider.send("evm_increaseTime", [
                      interval.toNumber() + 1,
                  ])
                  await network.provider.send("evm_mine", [])
                  await lottery.performUpkeep([])
                  await expect(
                      lottery.enterLottery({ value: lotteryEntryFee })
                  ).to.be.revertedWith("Lottery__NotOpen")
              })
              describe("perfrom checkUpkeep", function () {
                  it("returns false if people doesnt send enough ETH", async function () {
                      await network.provider.send("evm_increaseTime", [
                          interval.toNumber() + 1,
                      ])
                      await network.provider.send("evm_mine", [])
                      const { upKeepNeeded } =
                          await lottery.callStatic.checkUpkeep([])
                      assert(!upKeepNeeded)
                  })
                  it("returns false if lottery isn't open", async function () {
                      await lottery.enterLottery({ value: lotteryEntryFee })
                      await network.provider.send("evm_increaseTime", [
                          interval.toNumber() + 1,
                      ])
                      await network.provider.send("evm_mine", [])
                      await lottery.performUpkeep([])
                      const lotteryState = await lottery.getLotteryState()
                      const { upKeepNeeded } =
                          await lottery.callStatic.checkUpkeep([])
                      assert.equal(lotteryState, "1")
                      assert.equal(upKeepNeeded, false)
                  })
              })
              describe("performUpKeep", function () {
                  it("only run if checkUpkeep is true", async function () {
                      await lottery.enterLottery({ value: lotteryEntryFee })
                      await network.provider.send("evm_increaseTime", [
                          interval.toNumber() + 1,
                      ])
                      await network.provider.send("evm_mine", [])
                      const tx = await lottery.performUpkeep([])
                      assert(tx)
                  })
                  it("reverts if checkupkeep is false", async function () {
                      await expect(
                          lottery.performUpkeep([])
                      ).to.be.revertedWith("Lottery__upKeepNotNeeded")
                  })
                  it("change the lottery state, emits an event, calls vrfcoordinator for request id", async function () {
                      await lottery.enterLottery({ value: lotteryEntryFee })
                      await network.provider.send("evm_increaseTime", [
                          interval.toNumber() + 1,
                      ])
                      await network.provider.send("evm_mine", [])

                      const txResponse = await lottery.performUpkeep([])
                      const txReceipt = await txResponse.wait(1)
                      const requestId = await txReceipt.events[1].args.requestId
                      const lotteryState = await lottery.getLotteryState()
                      assert(requestId.toNumber() > 0)
                      assert(lotteryState == 1)
                  })
              })
              describe("FulFill Random Numbers", function () {
                  beforeEach(async function () {
                      await lottery.enterLottery({ value: lotteryEntryFee })
                      await network.provider.send("evm_increaseTime", [
                          interval.toNumber() + 1,
                      ])
                      await network.provider.send("evm_mine", [])
                  })
                  it("can only called after performUpkeep", async function () {
                      await expect(
                          vrfCoordinatorV2Mock.fulfillRandomWords(
                              0,
                              lottery.address
                          )
                      ).to.be.revertedWith("nonexistent request")
                      await expect(
                          vrfCoordinatorV2Mock.fulfillRandomWords(
                              1,
                              lottery.address
                          )
                      ).to.be.revertedWith("nonexistent request")
                  })
                  //
                  it("picks a winner, reset the lottery, and sends money", async function () {
                      // adding more players
                      const additionalEntrants = 3
                      const startingAccountIndex = 1 // since deployer is 0
                      const accounts = await ethers.getSigners()
                      for (
                          let i = startingAccountIndex;
                          i < startingAccountIndex + additionalEntrants;
                          i++
                      ) {
                          const accountsConnectedLottery = lottery.connect(
                              accounts[i]
                          )
                          await accountsConnectedLottery.enterLottery({
                              value: lotteryEntryFee,
                          })
                      }
                      const startingTimeStamp = await lottery.getLastTimeStamp()

                      // performUpkeep
                      // fulfillRandomWords
                      // we will have to wait for the fulfillRandomWords to be called

                      await new Promise(async (resolve, reject) => {
                          lottery.once("WinnerPicked", async () => {
                              console.log("Found the Event!")
                              try {
                                  const recentWinner =
                                      await lottery.getRecentWinner()
                                  console.log(recentWinner)
                                  console.log(accounts[0].address)
                                  console.log(accounts[1].address)
                                  console.log(accounts[2].address)
                                  console.log(accounts[3].address)

                                  const lotteryState =
                                      await lottery.getLotteryState()
                                  const endingTimeStamp =
                                      await lottery.getLastTimeStamp()
                                  const numPlayers =
                                      await lottery.getNumberOfPlayers()
                                  const accountEndingBalance =
                                      await accounts[2].getBalance()

                                  assert.equal(numPlayers.toString(), "0")
                                  assert.equal(lotteryState.toString(), "0")
                                  assert.equal(
                                      accountEndingBalance.toString(),
                                      accountStartingBalance
                                          .add(
                                              lotteryEntryFee
                                                  .mul(additionalEntrants)
                                                  .add(lotteryEntryFee)
                                          )
                                          .toString()
                                  )
                                  assert(endingTimeStamp > startingTimeStamp)
                                  resolve()
                              } catch (e) {
                                  reject(e)
                              }
                          })
                          // setting up listener
                          // below, we will fire the event and listener will pick it up and resolve
                          const tx = await lottery.performUpkeep([])
                          const txReceipt = await tx.wait(1)
                          const accountStartingBalance =
                              await accounts[2].getBalance()
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              txReceipt.events[1].args.requestId,
                              lottery.address
                          )
                      })
                  })
              })
          })
      })
