"use client";

import Link from "next/link";
import { serif } from "../layout";
import { useMultichain } from "@/hooks/useMultichain";
import { parseUnits } from "viem";

export default function InvestPage() {
  const { executeTransaction, isReady, smartAccount, customProvider } =
    useMultichain();

  const handleTransaction = async () => {
    if (!isReady) return;
    const address = await smartAccount!.getAddress();
    const amountWei = parseUnits("0.01", 18);
    console.log("start send...");

    try {
      const tx = {
        account: address,
        to: "0x0FC28558E05EbF831696352363c1F78B4786C4e5",
        value: amountWei,
      };

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
