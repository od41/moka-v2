"use client";

import Link from "next/link";
import { serif } from "../layout";
import { useMultichain } from "@/hooks/useMultichain";
import { encodeFunctionData, parseUnits, erc20Abi } from "viem";
import { buildItx, singleTx, rawTx } from "klaster-sdk";
import { baseSepolia } from "viem/chains";
import { useAccount } from "@particle-network/connectkit";

export default function InvestPage() {
  const { address } = useAccount();
  const { executeTransaction, isReady, klaster, customProvider } =
    useMultichain();

  const handleTransaction = async () => {
    if (!isReady) return;

    const amountWei = parseUnits("0.002", 6);
    console.log("start send...", amountWei);
    const sendERC20Op = rawTx({
      gasLimit: BigInt("10000"),
      to: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC contract address on base sepolia
      data: encodeFunctionData({
        abi: erc20Abi,
        functionName: "transfer",
        args: ["0x0FC28558E05EbF831696352363c1F78B4786C4e5", amountWei],
      }),
    });

    try {
      const tx = buildItx({
        steps: [singleTx(baseSepolia.id, sendERC20Op)],
        feeTx: klaster!.encodePaymentFee(baseSepolia.id, "USDC"),
      });

      const result = await executeTransaction(tx);
      console.log("Transaction result:", result);
    } catch (error) {
      console.error("Transaction failed:", error);
    }
  };
  return (
    <>
      <main className="w-screen h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-[320px]">
          <h2 style={serif.style} className="text-xl mb-3">
            Simple transaction
          </h2>
          <button
            className="gradientButton text-primaryBtnText rounded px-14 py-3 text-sm font-light"
            onClick={handleTransaction}
          >
            tx
          </button>
        </div>
      </main>
    </>
  );
}
