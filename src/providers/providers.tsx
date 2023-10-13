import { constants } from "@/constants";
import { Network } from "@mintbase-js/sdk";
import DataProvider from "./data";
import { AppProvider } from "./app";
import { WalletContextProvider } from "@mintbase-js/react";

import { setupAuthWallet } from "@mintbase-js/wallet";
import { setupNearWallet } from "@near-wallet-selector/near-wallet";
import { setupMyNearWallet } from "@near-wallet-selector/my-near-wallet";
import '@near-wallet-selector/modal-ui/styles.css';

const Providers = ({ children }: { children: React.ReactNode }) => {
  
  return (
    <WalletContextProvider
      contractAddress={constants.tokenContractAddress}
      network={constants.network as Network}
      // additionalWallets={[
      //   setupNearWallet(),
      //   setupMyNearWallet(),
      //   //@ts-ignore
      //   setupAuthWallet({
      //     networkId: constants.network as "testnet" | "mainnet",
      //     relayerUrl: "/api/relay",
      //     signInContractId: constants.tokenContractAddress,
      //     walletUrl: constants.mintbaseWalletUrl,
      //   })
      // ]}
    >
      <AppProvider>
        <DataProvider>{children}</DataProvider>
      </AppProvider>
    </WalletContextProvider>
  );
};

export default Providers;
