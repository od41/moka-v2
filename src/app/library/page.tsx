"use client";

import { useState, useEffect } from "react";
import { useMyBooks } from "@/hooks/useMyBooks";
import { constants } from "@/constants";
import { useWallet } from "@mintbase-js/react";
import { PageTemplate } from "@/components/pages/page-template";
import { Spinner } from "@/components/Spinner";
import { MINSTA_META } from "@/data/fallback";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_META_TITLE ?? MINSTA_META.title,
  description:
    process.env.NEXT_PUBLIC_META_DESCRIPTION ?? MINSTA_META.description,
    
  openGraph: {
    title: process.env.NEXT_PUBLIC_META_TITLE ?? MINSTA_META.title,
    description:
      process.env.NEXT_PUBLIC_META_DESCRIPTION ?? MINSTA_META.description,
    images: [
      {
        type: "image/png",
        url: process.env.NEXT_PUBLIC_META_IMAGE ?? MINSTA_META.image,
        width: "1200",
        height: "630",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: process.env.NEXT_PUBLIC_META_TITLE ?? MINSTA_META.title,
    description:
      process.env.NEXT_PUBLIC_META_DESCRIPTION ?? MINSTA_META.description,
    siteId: "1467726470533754880",
    creator: "Mintbase",
    images: process.env.NEXT_PUBLIC_META_IMAGE ?? MINSTA_META.image,
  },
  
};

export default function Library() {
  const { activeAccountId } = useWallet()
  const {
    data,
    isLoading: isDataLoading,
    isFetching,
    refetchBooks,
  } = useMyBooks({ accountId: activeAccountId, contractAddress: constants.tokenContractAddress });


  useEffect(() => {
    refetchBooks();
  }, [activeAccountId]);


  if (isDataLoading) {
    return <Spinner />
  }

  return (<>
    <PageTemplate
      title="My Books"
      data={data}
      isLoading={isDataLoading}
      isOwned={true}
    />
  </>);
}