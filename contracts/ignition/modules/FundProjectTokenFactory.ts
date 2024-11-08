import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FundProjectTokenFactoryModule = buildModule(
  "FundProjectTokenFactoryModule",
  (m) => {
    // Deploy the FundProjectTokenFactory contract
    const fundProjectTokenFactory = m.contract("FundProjectTokenFactory", []);
    console.log(
      "fundProjectTokenFactory",
      fundProjectTokenFactory.module.futures
    );
    return { fundProjectTokenFactory };
  }
);

export default FundProjectTokenFactoryModule;
