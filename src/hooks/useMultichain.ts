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
} from "klaster-sdk";
import { baseSepolia, optimismSepolia } from "viem/chains";

export const useMultichain = () => {
  const { address } = useAccount();
  const [customProvider, setCustomProvider] = useState<any | null>(null);
  const [klaster, setKlaster] = useState<KlasterSDK<any> | null>(null);
  const [primaryWallet] = useWallets();
  const [unifiedBalance, setUnifiedBalance] = useState<any | null>(null);

  console.log("address", address);
  console.log("primaryWallet", primaryWallet);

  // Add Klaster initialization helper
  const initializeKlaster = async (address: `0x{string}`) => {
    const tempKlaster = await initKlaster({
      accountInitData: loadBicoV2Account({
        owner: address,
      }),
      nodeUrl: klasterNodeHost.default,
    });
    console.log("tempKlaster", tempKlaster);
    return tempKlaster;
  };

  useEffect(() => {
    if (address && primaryWallet) {
      // First initialize the smart wallet
      primaryWallet.connector.getProvider().then((providerTemp) => {
        setCustomProvider(providerTemp);
        initializeKlaster(address as `0x{string}`).then(setKlaster);
      });
    } else {
      setCustomProvider(null);
      setKlaster(null);
    }
  }, [address, primaryWallet]);

  const executeTransaction = async (itx: any) => {
    if (!klaster || !customProvider) throw new Error("Klaster not initialized");

    console.log("start execute", itx);

    const _provider = primaryWallet.getWalletClient();
    console.log("_provider", _provider);

    try {
      const quote = await klaster.getQuote(itx);
      const signature = await _provider.signMessage({
        message: { raw: quote.itxHash },
        account: primaryWallet.accounts[0] as `0x{string}`,
      });
      const result = await klaster.execute(quote, signature);
      console.log("execute result", result);
      return result;
    } catch (error) {
      console.error("Transaction failed:", error);
      throw error;
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

    console.log("ubals", unifiedBalance);
  }, [klaster]);

  return {
    klaster,
    executeTransaction,
    customProvider,
    isReady: !!klaster && !!customProvider,
  };
};
