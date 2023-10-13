"use client";

import { serif } from "@/app/layout";
import { MINSTA_TEXTS } from "@/data/fallback";
import { useApp } from "@/providers/app";
import { useWallet } from "@mintbase-js/react";
import React, { useEffect } from "react";
import InlineSVG from "react-inlinesvg";

const Modal = ({ children }: { children?: React.ReactNode }) => {
  const { isMainModalOpen, closeModal } = useApp();
  const { connect, disconnect, isConnected, activeAccountId } = useWallet();

  const texts = {
    about: {
      first: process.env.NEXT_PUBLIC_TEXT_ABOUT_1ST || MINSTA_TEXTS.about.first,
      sec: process.env.NEXT_PUBLIC_TEXT_ABOUT_2ND || MINSTA_TEXTS.about.sec,
      third: process.env.NEXT_PUBLIC_TEXT_ABOUT_3RD || MINSTA_TEXTS.about.third,
    },
  };

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
        <div className="overflow-y-auto flex-1 h-auto w-full rounded-t-lg text-modalText p-5 max-w-md mx-auto overflow-y-auto flex flex-col">
          <div className="mb-8 flex flex-col gap-2 items-center mt-4">
            <h1 style={serif.style} className="text-3xl font-bold">{process.env.NEXT_PUBLIC_APP_TITLE || "Moka"}</h1>
          </div>

          <div
            className={`mb-14 text-center justify-center ${isConnected ? "flex gap-8 mt-8" : ""
              }`}
          >

            {isConnected ? <div>
              <div className="text-sm">You're connected</div>
              <button 
              className="border mt-4 px-14 py-3 text-sm font-light rounded-md " 
              onClick={() => disconnect()}
            >
              Disconnect <span className="font-semibold">{activeAccountId}</span>
            </button>
            </div> : <button
              className="gradientButton text-primaryBtnText rounded px-14 py-3 text-sm font-light"
              onClick={() => connect()}
            >
              Connect
            </button>
            }
          </div>

          <div>
            <p className="uppercase text-xs mb-1.5 text-center">POWERED BY</p>
            <div className="flex justify-center gap-5">
              <InlineSVG
                src="/images/MB_logo.svg"
                className="fill-current text-modal"
              />
              <InlineSVG
                src="/images/near_logo.svg"
                className="fill-current text-modal"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
