import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const FundProjectTokenFactoryModule = buildModule(
  "FundProjectTokenFactoryModule",
  (m) => {
    // First deploy the implementation contract
    const fundProjectTokenImplementation = m.contract("FundProjectToken", []);

    // Wait for the implementation to be deployed before deploying the factory
    const fundProjectTokenFactory = m.contract("FundProjectTokenFactory", [
      "0xf1f65C21aA660c3b96Cb04D4544D70D396Ba82AA",
    ]);

    return {
      implementation: fundProjectTokenImplementation,
      factory: fundProjectTokenFactory,
    };
  }
);

export default FundProjectTokenFactoryModule;
