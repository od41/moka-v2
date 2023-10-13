"use client";

import { DynamicGrid } from "@/components/DynamicGrid";
import React, { useEffect } from "react";

import { useFirstToken } from "@/hooks/useFirstToken";
import { useFeed } from "@/hooks/useFeed";
import { constants } from "@/constants";
import { useBlockedNfts } from "@/hooks/useBlockedNfts";
import { PageTemplate } from "./page-template";
import { Spinner } from "@/components/Spinner";

export const StorePage = () => {
  const { newToken, tokensFetched, isLoading } = useFirstToken();
  const  {
    data,
    isLoading: isDataLoading,
    isFetching,
    refetchNfts,
  } = useFeed({accountId: constants.proxyContractAddress, contractAddress: constants.tokenContractAddress})
  
  const { blockedNfts } = useBlockedNfts();

  const firstTokenisBlocked =
    newToken?.metadata_id && blockedNfts?.includes(newToken?.metadata_id);

  useEffect(() => {
    let reloadTimeout: any;

    if (!newToken?.media) {
      reloadTimeout = setTimeout(() => {
        // Reload the page after 4 minutes (120,000 milliseconds)
        window.location.reload();
      }, 360000); //4 minutes in milliseconds
    }

    return () => {
      // Clear the timeout if the component unmounts
      clearTimeout(reloadTimeout);
    };
  }, [newToken]);

  if (isDataLoading) {
    return <Spinner />
  }

  return (
    <>
      <PageTemplate 
        title="Moka Store"
        data={data}
        blockedNfts={blockedNfts}
        isLoading={isLoading}
      />
    </>
  );
};
