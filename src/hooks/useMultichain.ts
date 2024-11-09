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
import { createPublicClient } from "viem";

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

  const getItxStatus = async (itxHash: string) => {
    if (!klaster) throw new Error("Klaster not initialized");
    const klasterEndpoint = "https://klaster-node.polycode.sh/v2/explorer/";
    const status = await fetch(`${klasterEndpoint}/${itxHash}`);
    return status;
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
    publicClient
  };
};
