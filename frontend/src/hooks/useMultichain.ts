import { useEffect, useState } from "react";
import { useAccount, useWallets } from "@particle-network/connectkit";
import {
  type KlasterSDK,
  initKlaster,
  loadBicoV2Account,
  klasterNodeHost,
  buildMultichainReadonlyClient,
  buildRpcInfo,
  buildTokenMapping,
  deployment,
  InterchainTransaction,
} from "klaster-sdk";
import { baseSepolia, optimismSepolia } from "viem/chains";
import { http } from "viem";
import { createPublicClient, type PublicClient } from "viem";

interface KlasterStatusResponse {
  itxHash: string;
  walletProvider: string;
  node: string;
  commitment: string;
  paymentInfo: {
    chainId: string;
    token: string;
    tokenAmount: string;
    tokenWeiAmount: string;
    tokenValue: string;
  };
  userOps: Array<{
    userOpHash: `0x${string}`;
    userOp: {
      sender: string;
      nonce: string;
      initCode: string;
      callData: string;
      callGasLimit: string;
      verificationGasLimit: string;
      maxFeePerGas: string;
      maxPriorityFeePerGas: string;
      paymasterAndData: string;
      preVerificationGas: string;
      logs?: Array<{
        data: string;
        topics: string[];
      }>;
    };
    executionStatus: "SUCCESS" | "PENDING" | "FAILED";
    executionData: string;
    executionError: string;
  }>;
}

export const useMultichain = () => {
  const { address } = useAccount();
  const [walletClient, setWalletClient] = useState<any | null>(null);
  const [klaster, setKlaster] = useState<KlasterSDK<any> | null>(null);
  const [primaryWallet] = useWallets();
  const [unifiedBalance, setUnifiedBalance] = useState<any | null>(null);
  // smart wallet address use state
  const [smartWalletAddress, setSmartWalletAddress] = useState<`0x${string}`>();

  // Add Klaster initialization helper
  const initializeKlaster = async (address: `0x{string}`) => {
    const tempKlaster = await initKlaster({
      accountInitData: loadBicoV2Account({
        // pass this to particle wallet or pass partcle wallets here
        owner: address,
      }),
      nodeUrl: klasterNodeHost.default,
    });
    setKlaster(tempKlaster);
    setSmartWalletAddress(Array.from(tempKlaster?.account.uniqueAddresses)[0]);

    return tempKlaster;
  };

  useEffect(() => {
    if (address && primaryWallet) {
      // First initialize the smart wallet
      primaryWallet.connector.getProvider().then((providerTemp) => {
        setWalletClient(providerTemp);
        initializeKlaster(address as `0x{string}`).then(
          (res) => "do something"
        );
      });
    } else {
      setWalletClient(null);
      setKlaster(null);
    }
  }, [address, primaryWallet]);

  const getQuote = async (itx: InterchainTransaction) => {
    if (!klaster) throw new Error("Klaster not initialized");
    const quote = await klaster.getQuote(itx);
    return quote;
  };

  const executeTransaction = async (itx: InterchainTransaction) => {
    if (!klaster || !walletClient) throw new Error("Klaster not initialized");

    console.log("start execute", itx);

    const _provider = primaryWallet.getWalletClient();
    console.log("_provider", _provider);

    try {
      const quote = await klaster.getQuote(itx);
      console.log("quote", quote);
      const signature = await _provider.signMessage({
        message: { raw: quote.itxHash },
        account: primaryWallet.accounts[0] as `0x{string}`,
      });
      const receipt = await klaster.execute(quote, signature);
      console.log("execute receipt", receipt);
      return receipt;
    } catch (error) {
      console.error("Transaction failed:", error);
      throw error;
    }
  };

  const getItxStatus = async (
    itxHash: string
  ): Promise<KlasterStatusResponse> => {
    if (!klaster) throw new Error("Klaster not initialized");

    const klasterEndpoint = "https://klaster-node.polycode.sh/v2/explorer";

    // Poll until we get a non-empty status with completed execution
    while (true) {
      const response = await fetch(`${klasterEndpoint}/${itxHash}`);
      const status: KlasterStatusResponse = await response.json();

      // Check if all userOps have a non-pending status
      const allOpsCompleted = status.userOps?.every(
        (op) => op.executionStatus !== "PENDING"
      );

      if (allOpsCompleted) {
        // Check if any operations failed
        const anyOpsFailed = status.userOps?.some(
          (op) => op.executionStatus === "FAILED"
        );

        if (anyOpsFailed) {
          // Get the first error message
          const errorMessage = status.userOps.find(
            (op) => op.executionError
          )?.executionError;
          throw new Error(
            `Transaction failed: ${errorMessage || "Unknown error"}`
          );
        }

        console.log("status", status);

        return status;
      }

      // Wait before polling again
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  };

  // Helper function to wait for receipt with retries
  const waitForReceipt = async (
    client: PublicClient,
    hash: `0x${string}`,
    maxAttempts = 5
  ): Promise<any> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const receipt = await client.waitForTransactionReceipt({
          hash,
          retryCount: 3, // 3 attempts
          pollingInterval: 12_000, // 1 second between attempts
        });
        return receipt;
      } catch (error) {
        console.log(`Attempt ${attempt} failed. Retrying...`);
        if (attempt === maxAttempts) throw error;
        // Exponential backoff between attempts
        await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
      }
    }
  };

  useEffect(() => {
    if (!klaster) return;

    const mcClient = buildMultichainReadonlyClient([
      buildRpcInfo(optimismSepolia.id, optimismSepolia.rpcUrls.default.http[0]),
      buildRpcInfo(baseSepolia.id, baseSepolia.rpcUrls.default.http[0]),
    ]);

    const mcUSDC = buildTokenMapping([
      // deployment(
      //   optimismSepolia.id,
      //   "0x5fd84259d66Cd46123540766Be93DFE6D43130D7"
      // ),
      deployment(baseSepolia.id, "0x036CbD53842c5426634e7929541eC2318f3dCF7e"),
    ]);

    const getUBalances = async () => {
      const uBal = await mcClient.getUnifiedErc20Balance({
        tokenMapping: mcUSDC,
        account: klaster.account,
      });
      if (uBal) {
        setUnifiedBalance(uBal);
      }
    };
    getUBalances();
  }, [klaster]);

  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(),
  });

  return {
    klaster,
    executeTransaction,
    unifiedBalance,
    walletClient,
    isReady: !!klaster && !!walletClient,
    smartWalletAddress,
    getQuote,
    getItxStatus,
    publicClient,
    waitForReceipt,
  };
};
