import { useEffect, useState } from "react";
import { useAccount, useWallets } from "@particle-network/connectkit";
import {
  SmartAccount,
  AAWrapProvider,
  SendTransactionMode,
} from "@particle-network/aa";
import { initializeKlaster, initializeSmartWallet } from "@/providers/wallet";
import { type KlasterSDK } from "klaster-sdk";

export const useMultichain = () => {
  const { address, chainId } = useAccount();
  const [smartAccount, setSmartAccount] = useState<SmartAccount | null>(null);
  const [customProvider, setCustomProvider] = useState<any | null>(null);
  const [klaster, setKlaster] = useState<KlasterSDK<any> | null>(null);
  const [primaryWallet] = useWallets();

  useEffect(() => {
    if (address && primaryWallet) {
      // First initialize the smart wallet
      initializeSmartWallet(primaryWallet).then((swResponse) => {
        const [smartWalletTemp, customProviderTemp] = swResponse;
        setSmartAccount(smartWalletTemp);
        setCustomProvider(customProviderTemp);
        initializeKlaster(address as `0x{string}`).then(setKlaster);
      });
    } else {
      setSmartAccount(null);
      setCustomProvider(null);
      setKlaster(null);
    }
  }, [address, primaryWallet]);

  const executeTransaction = async (itx: any) => {
    if (!klaster || !smartAccount || !customProvider)
      throw new Error("Smart Account or Klaster not initialized");

    console.log("start execute", itx);

    try {
      const quote = await klaster.getQuote(itx);
      const signature = await customProvider.signUserOperation(quote.itxHash);
      const result = await klaster.execute(quote, signature);
      return result;
    } catch (error) {
      console.error("Transaction failed:", error);
      throw error;
    }
  };

  return {
    smartAccount,
    klaster,
    executeTransaction,
    customProvider,
    isReady: !!klaster && !!smartAccount && !!customProvider,
  };
};
