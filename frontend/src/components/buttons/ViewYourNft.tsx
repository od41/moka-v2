"use client";
import React from "react";
import Link from "next/link";
import { constants } from "@/constants";
import InlineSVG from "react-inlinesvg";
import { useAccount } from "@particle-network/connectkit";

const ViewYourNfts = () => {
  const { address, isConnected } = useAccount();

  return isConnected ? (
    <div className="flex gap-2 items-center">
      <Link
        target="_blank"
        rel="noopener noreferrer"
        passHref
        href={`${constants.mintbaseBaseUrl}/human/${address}/owned/0`}
        className="text-linkColor text-sm"
      >
        View your NFTs
      </Link>
      <InlineSVG
        src="/images/link_arrow.svg"
        className="fill-current text-linkColor"
      />
    </div>
  ) : null;
};

export default ViewYourNfts;
