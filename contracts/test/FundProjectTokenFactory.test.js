const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { decodeEventLog } = require("viem");

describe("FundProjectTokenFactory", function () {
  async function deployFactoryFixture() {
    const [owner, treasury, user] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    const factory = await hre.viem.deployContract("FundProjectTokenFactory");

    return {
      factory,
      owner,
      treasury,
      user,
      publicClient,
    };
  }

  let factory;
  let owner;
  let treasury;
  let user;
  let publicClient;

  beforeEach(async function () {
    const fixture = await loadFixture(deployFactoryFixture);
    factory = fixture.factory;
    owner = fixture.owner;
    treasury = fixture.treasury;
    user = fixture.user;
    publicClient = fixture.publicClient;
  });

  describe("Token Creation", function () {
    it("should create a new token with correct treasury address", async function () {
      const hash = await factory.write.createToken([treasury.account.address]);
      await publicClient.waitForTransactionReceipt({ hash });

      const tokenAddress = await factory.read.getDeployedToken([0n]);
      const token = await hre.viem.getContractAt(
        "FundProjectToken",
        tokenAddress
      );

      expect((await token.read.treasuryAddress()).toLowerCase()).to.equal(
        treasury.account.address.toLowerCase()
      );
    });

    it("should transfer token ownership to creator", async function () {
      const hash = await factory.write.createToken([treasury.account.address]);
      await publicClient.waitForTransactionReceipt({ hash });

      const tokenAddress = await factory.read.getDeployedToken([0n]);
      const token = await hre.viem.getContractAt(
        "FundProjectToken",
        tokenAddress
      );

      expect((await token.read.owner()).toLowerCase()).to.equal(
        owner.account.address.toLowerCase()
      );
    });

    it("should emit TokenCreated event with correct parameters", async function () {
      const hash = await factory.write.createToken([treasury.account.address]);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const logs = await publicClient.getLogs({
        address: factory.address,
        event: {
          type: "event",
          name: "TokenCreated",
          inputs: [
            { type: "address", name: "tokenAddress", indexed: true },
            { type: "address", name: "treasury", indexed: true },
            { type: "address", name: "creator", indexed: true },
          ],
        },
        fromBlock: receipt.blockNumber,
        toBlock: receipt.blockNumber,
      });

      expect(logs.length).to.equal(1);
      const log = logs[0];

      const tokenAddress = await factory.read.getDeployedToken([0n]);
      expect(log.args.tokenAddress.toLowerCase()).to.equal(
        tokenAddress.toLowerCase()
      );
      expect(log.args.treasury.toLowerCase()).to.equal(
        treasury.account.address.toLowerCase()
      );
      expect(log.args.creator.toLowerCase()).to.equal(
        owner.account.address.toLowerCase()
      );
    });
  });

  describe("Token Tracking", function () {
    beforeEach(async function () {
      // Create token as owner
      const hash1 = await factory.write.createToken([treasury.account.address]);
      await publicClient.waitForTransactionReceipt({ hash: hash1 });

      // Create token as user
      const userFactory = await hre.viem.getContractAt(
        "FundProjectTokenFactory",
        await factory.address,
        { walletClient: user }
      );
      const hash2 = await userFactory.write.createToken([
        treasury.account.address,
      ]);
      await publicClient.waitForTransactionReceipt({ hash: hash2 });
    });

    it("should correctly track the number of deployed tokens", async function () {
      const count = await factory.read.getDeployedTokensCount();
      expect(count).to.equal(2n);
    });

    it("should return correct token address by index", async function () {
      const tokenAddress = await factory.read.getDeployedToken([0n]);
      expect(tokenAddress).to.match(/^0x[a-fA-F0-9]{40}$/i);
    });

    it("should revert when accessing invalid index", async function () {
      await expect(factory.read.getDeployedToken([99n])).to.be.rejectedWith(
        "Index out of bounds"
      );
    });

    it("should return all deployed tokens", async function () {
      const tokens = await factory.read.getAllDeployedTokens();
      expect(tokens.length).to.equal(2);
      tokens.forEach((token) => {
        expect(token).to.match(/^0x[a-fA-F0-9]{40}$/i);
      });
    });

    it("should create tokens with correct ownership", async function () {
      const token1Address = await factory.read.getDeployedToken([0n]);
      const token2Address = await factory.read.getDeployedToken([1n]);

      const token1 = await hre.viem.getContractAt(
        "FundProjectToken",
        token1Address
      );
      const token2 = await hre.viem.getContractAt(
        "FundProjectToken",
        token2Address
      );

      expect((await token1.read.owner()).toLowerCase()).to.equal(
        owner.account.address.toLowerCase()
      );
      expect((await token2.read.owner()).toLowerCase()).to.not.equal(
        user.account.address.toLowerCase()
      );
    });
  });
});
