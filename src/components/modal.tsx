"use client";

import { serif } from "@/app/layout";
import { useApp } from "@/providers/app";
import React, { useEffect } from "react";
import {
  useAccount,
  useDisconnect,
  ConnectButton,
} from "@particle-network/connectkit";
import Link from "next/link";
import { useMultichain } from "@/hooks/useMultichain";
import { formatUnits } from "viem";

const Modal = ({ children }: { children?: React.ReactNode }) => {
  const { isMainModalOpen, closeModal } = useApp();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { unifiedBalance, klaster } = useMultichain();

  useEffect(() => {
    if (!isMainModalOpen) return;
    // Disable scrolling on the background (body) when the modal is open
    document.body.style.overflow = "hidden";
    return () => {
      // Re-enable scrolling when the modal is closed
      document.body.style.overflow = "auto";
    };
  }, [isMainModalOpen]);

  const stopPropagation = (e: any) => {
    e.stopPropagation();
  };

  if (!isMainModalOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70 md:p-18 px-4"
      onClick={closeModal}
    >
      <div
        className="bg-mainBg rounded-xl shadow-lg max-w-md mx-auto flex flex-col h-auto"
        onClick={stopPropagation}
      >
        <div className="overflow-y-auto flex-1 h-auto w-full rounded-t-lg text-modalText p-5 max-w-md mx-auto flex flex-col">
          <div className="mb-8 flex flex-col gap-2 items-center mt-4">
            <h1 style={serif.style} className="text-3xl font-bold">
              {process.env.NEXT_PUBLIC_APP_TITLE || "Moka"}
            </h1>
          </div>

          <div
            className={`mb-14 text-center justify-center ${
              isConnected ? "flex gap-8 mt-8" : ""
            }`}
          >
            {isConnected ? (
              <div>
                <div className="text-sm">You&apos;re connected</div>
                <button
                  className="border mt-4 px-14 py-3 text-sm font-light rounded-md "
                  onClick={() => disconnect()}
                >
                  Disconnect signing key{" "}
                  <span className="font-semibold">{address}</span>
                </button>
                {/* show the user their usdc/usdt balance and their funding wallet address */}
                <div className="text-sm">
                  <span className="font-semibold">Funding Wallet:</span>{" "}
                  {klaster?.account.uniqueAddresses}
                </div>
                <div className="text-sm">
                  <span className="font-semibold">Funding WalletBalance:</span>{" "}
                  {unifiedBalance ? (
                    <>
                      {formatUnits(unifiedBalance?.balance, 6).toString()} USDC
                    </>
                  ) : (
                    <span className="italic text-xs">Loading balance...</span>
                  )}
                </div>
              </div>
            ) : (
              <ConnectButton />
            )}
          </div>

          <div>
            <p className="uppercase text-xs mb-1.5 text-center">built by</p>
            <div className="flex justify-center gap-5 italic">
              <Link href={"https://odafe41.com"} target="_blank">
                ...this guy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
