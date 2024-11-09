import { AppProvider } from "./app";
import { ParticleConnectkit } from "./wallet";

const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ParticleConnectkit>
      <AppProvider>{children}</AppProvider>
    </ParticleConnectkit>
  );
};

export default Providers;
