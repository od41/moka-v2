"use client";
import { constants } from "@/constants";
import { useApp } from "@/providers/app";
import { useWallet } from "@mintbase-js/react";
import { usePathname, useRouter } from "next/navigation";
import InlineSVG from "react-inlinesvg";
import Link from 'next/link'
import { serif } from "@/app/layout";

const Header = () => {
  const pathname = usePathname();
  const { isConnected } = useWallet();
  const { push } = useRouter();
  const { openModal } = useApp();

  const { isClosed } = constants;

  return (
    <>
      <header className="fixed left-0 top-0 flex w-full justify-center h-12 bg-primary text-headerText"
        style={{
          WebkitFontSmoothing: "antialiased",
          transition: "background-color .5s cubic-bezier(.28,.11,.32,1)",
          transitionProperty: "background-color,backdrop-filter,-webkit-backdrop-filter",
          backdropFilter: "saturate(180%) blur(20px)",
          backgroundColor: 'rgba(251,251,253,.8)'
        }}
      >
        <div className="flex w-full justify-between px-4 lg:px-12 items-center">
          <Link style={serif.style} href="/" className="text-xl font-semibold text-[#3F305B] h-8 w-8 text-headerText">
            {constants.appName}
          </Link>
          <div className="flex gap-4 items-center">
            {isConnected && <>
              <Link
                className={`link ${pathname === '/library' ? 'font-semibold text-[#3F305B]' : ''}`}
                href="/library"
              >
                My Books
              </Link>
              <Link
                className={`link ${pathname === '/publish' ? 'font-semibold text-[#3F305B]' : ''}`}
                href={process.env.NEXT_PUBLIC_PUBLISHER_DASHBOARD ? process.env.NEXT_PUBLIC_PUBLISHER_DASHBOARD : "/publish"}
              >
                Publish
              </Link>
            </>
            }
            <button className="border px-2 py-1 rounded-full" onClick={() => openModal("default")}>
              {isConnected ? "Connected" : "Connect Wallet"}
            </button>
          </div>
        </div>
      </header>
      {isClosed ? (
        <div className="text-center text-mainText w-full absolute m-auto left-0 right-0 notify text-sm font-sans">
          Minting is closed. Thanks to everyone who participated.
        </div>
      ) : null}
    </>
  );
};

export default Header;
