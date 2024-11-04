import DataProvider from "./data";
import { AppProvider } from "./app";
import {ParticleConnectkit} from "./wallet";
import '@near-wallet-selector/modal-ui/styles.css';

const Providers = ({ children }: { children: React.ReactNode }) => {
  
  return (
    <ParticleConnectkit
    >

      <AppProvider>
        <DataProvider>{children}</DataProvider>
      </AppProvider>
    </ParticleConnectkit>
  );
};

export default Providers;
