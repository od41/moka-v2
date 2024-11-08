import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FundProjectTokenFactoryModule = buildModule(
  "FundProjectTokenFactoryModule",
  (m) => {
    // First deploy the implementation contract (it won't be used directly)
    const fundProjectTokenImplementation = m.contract("FundProjectToken", []);

    // Deploy the factory with the implementation address
    const fundProjectTokenFactory = m.contract("FundProjectTokenFactory", []);

    // Log for debugging
    console.log(
      "Deployed contracts:",
      {
        implementation: fundProjectTokenImplementation.module.futures,
        factory: fundProjectTokenFactory.module.futures
      }
    );

    return { 
      fundProjectTokenImplementation,
      fundProjectTokenFactory 
    };
  }
);

export default FundProjectTokenFactoryModule;
