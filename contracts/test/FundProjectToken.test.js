const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { parseEther, formatEther } = require("viem");

describe("FundProjectToken", function () {
  let FundProjectToken;
  let token;
  let owner;
  let treasury;
  let buyer;
  let seller;
  const BASE_PRICE = parseEther("0.001");
  const PRECISION = parseEther("1");

  // beforeEach(async function () {
  async function deployTokenFixture() {
    const [owner, treasury, buyer, seller] = await hre.viem.getWalletClients();
    const publicClient = await hre.viem.getPublicClient();

    const fundProjectToken = await hre.viem.deployContract("FundProjectToken", [
      treasury.account.address,
    ]);

    return {
      token: fundProjectToken,
      owner,
      treasury,
      buyer,
      seller,
      publicClient,
    };
  }

  beforeEach(async function () {
    const fixture = await loadFixture(deployTokenFixture);
    token = fixture.token;
    owner = fixture.owner;
    treasury = fixture.treasury;
    buyer = fixture.buyer;
    seller = fixture.seller;
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect((await token.read.owner()).toLowerCase()).to.equal(
        owner.account.address.toLowerCase()
      );
    });

    it("Should set the right treasury", async function () {
      expect((await token.read.treasuryAddress()).toLowerCase()).to.equal(
        treasury.account.address.toLowerCase()
      );
    });

    it("Should set the correct initial fees", async function () {
      expect(await token.read.buyFeePercent()).to.equal(500n);
      expect(await token.read.sellFeePercent()).to.equal(500n);
    });
  });

  describe("Price Calculations", function () {
    it("Should return correct initial price", async function () {
      const price = await token.read.getCurrentPrice();
    
      // When supply is 0, sqrt(0) = 0, so price should be BASE_PRICE
      expect(price).to.equal(BASE_PRICE);
    });

    it("Should calculate correct tokens for ETH", async function () {
      const ethAmount = parseEther("0.1");
      const tokens = await token.read.getTokensForETH([ethAmount]);
      expect(tokens).to.be.gt(0n);
    });

    it("Should revert when calculating tokens for 0 ETH", async function () {
      await expect(token.read.getTokensForETH([0n])).to.be.rejectedWith(
        "ETH amount must be greater than 0"
      );
    });

    describe("Token Purchase", function () {
      it("Should mint tokens when ETH is sent", async function () {
        const ethAmount = parseEther("1");
        const expectedTokens = await token.read.getTokensForETH([
          (ethAmount * 95n) / 100n,
        ]); // Accounting for 5% fee

        await token.write.buyTokens({
          value: ethAmount,
          account: buyer.account.address,
        });

        const balance = await token.read.balanceOf([buyer.account.address]);
        expect(balance).to.equal(expectedTokens);
      });

      it("Should collect correct fee amount", async function () {
        const ethAmount = parseEther("1");
        const expectedFee = (ethAmount * 500n) / 10000n; // 5% fee
        const { publicClient } = await loadFixture(deployTokenFixture);

        const treasuryBalanceBefore = await publicClient.getBalance({
          address: treasury.account.address,
        });

        await token.write.buyTokens({
          value: ethAmount,
          account: buyer.account.address,
        });

        const treasuryBalanceAfter = await publicClient.getBalance({
          address: treasury.account.address,
        });
        expect(treasuryBalanceAfter - treasuryBalanceBefore).to.equal(
          expectedFee
        );
      });
    });

    describe("Token Sale", function () {
      beforeEach(async function () {
        // Buy tokens first
        await token.write.buyTokens({
          value: parseEther("1"),
          account: buyer.account.address,
        });
      });

      it("Should burn tokens and return ETH when selling", async function () {
        const tokenBalance = await token.read.balanceOf([
          buyer.account.address,
        ]);
        const expectedEth = await token.read.getETHForTokens([tokenBalance]);
        const expectedEthAfterFee = (expectedEth * 95n) / 100n; // Accounting for 5% fee

        await token.write.sellTokens([tokenBalance], {
          account: buyer.account.address, // Specify the account explicitly
        });

        const newBalance = await token.read.balanceOf([buyer.account.address]);
        expect(newBalance).to.equal(0n);
      });

      it("Should revert when selling more tokens than owned", async function () {
        const tokenBalance = await token.read.balanceOf([
          buyer.account.address,
        ]);
        await expect(
          token.write.sellTokens([tokenBalance + 1n], {
            account: buyer.account.address,
          })
        ).to.be.rejectedWith("Insufficient token balance");
      });
    });

    describe("Admin Functions", function () {
      it("Should allow owner to change treasury address", async function () {
        const newTreasury = seller.account.address;
        await token.write.setTreasuryAddress([newTreasury], {
          account: owner.account.address,
        });
        expect((await token.read.treasuryAddress()).toLowerCase()).to.equal(
          newTreasury.toLowerCase()
        );
      });

      it("Should allow owner to change fees", async function () {
        await token.write.setFees([300n, 300n], {
          account: owner.account.address,
        });
        expect(await token.read.buyFeePercent()).to.equal(300n);
        expect(await token.read.sellFeePercent()).to.equal(300n);
      });

      it("Should revert if non-owner tries to change fees", async function () {
        await expect(
          token.write.setFees([300n, 300n], {
            account: buyer.account.address,
          })
        ).to.be.rejectedWith(token, "OwnableUnauthorizedAccount");
      });

      it("Should revert if fees are set too high", async function () {
        await expect(
          token.write.setFees([1100n, 1100n], {
            account: owner.account.address,
          })
        ).to.be.rejectedWith("Fees cannot exceed 10%");
      });
    });

    describe("Edge Cases", function () {
      it("Should revert when buying tokens with 0 ETH", async function () {
        await expect(
          token.write.buyTokens({
            value: 0n,
            account: buyer.account.address,
          })
        ).to.be.rejectedWith("ETH amount must be greater than 0");
      });

      it("Should revert when selling tokens with 0 balance", async function () {
        await expect(
          token.write.sellTokens([1n], {
            account: buyer.account.address,
          })
        ).to.be.rejectedWith("Insufficient token balance");
      });
    });
  });
});
