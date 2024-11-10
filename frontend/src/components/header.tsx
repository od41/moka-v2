"use client";
import { constants } from "@/constants";
import { useApp } from "@/providers/app";

import { usePathname, useRouter } from "next/navigation";

import Link from "next/link";
import { serif } from "@/app/layout";

// Particle imports
import { useAccount } from "@particle-network/connectkit";

const navigation = {
  main: [
    { name: "Books Terminal", href: "/terminal" },
    { name: "Library", href: "/library" },
  ],
  authenticated: [
    { name: "Create Book Fund", href: "/terminal/create" },
    { name: "My Books", href: "/my-books" },
    { name: "Publish Book", href: "/publish" },
  ],
};

const Header = () => {
  const pathname = usePathname();
  // const { isConnected } = useWallets();
  const { address, isConnected, isConnecting, isDisconnected, chainId } =
    useAccount();
  const { push } = useRouter();
  const { openModal } = useApp();

  const { isClosed } = constants;

  return (
    <>
      <header
        className="fixed left-0 top-0 flex w-full justify-center h-12 bg-primary text-headerText"
        style={{
          WebkitFontSmoothing: "antialiased",
          transition: "background-color .5s cubic-bezier(.28,.11,.32,1)",
          transitionProperty:
            "background-color,backdrop-filter,-webkit-backdrop-filter",
          backdropFilter: "saturate(180%) blur(20px)",
          backgroundColor: "rgba(251,251,253,.8)",
        }}
      >
        <div className="flex w-full justify-between px-4 lg:px-12 items-center">
          <Link
            style={serif.style}
            href="/"
            className="text-xl font-semibold text-[#3F305B] h-8 w-8 text-headerText hover:text-blue-600"
          >
            {constants.appName}
          </Link>
          <div className="flex gap-4 items-center">
            {isConnected && (
              <>
                <div className="flex gap-4 items-center">
                  {navigation.main.map((item) => (
                    <Link
                      key={item.name}
                      className={`link hover:font-medium hover:text-blue-600 ${
                        pathname.includes(item.href)
                          ? "font-semibold text-[#3F305B]"
                          : ""
                      }`}
                      href={item.href}
                    >
                      {item.name}
                    </Link>
                  ))}
                  <span> | </span>
                  {navigation.authenticated.map((item) => (
                    <Link
                      key={item.name}
                      className={`link hover:font-medium hover:text-blue-600 ${
                        pathname.includes(item.href)
                          ? "font-semibold text-[#3F305B]"
                          : ""
                      }`}
                      href={item.href}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </>
            )}
            <button
              className="border px-2 py-1 rounded-full"
              onClick={() => openModal("default")}
            >
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
