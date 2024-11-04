"use client";

import { useState, useEffect } from "react";
import { useMyBooks } from "@/hooks/useMyBooks";
import { constants } from "@/constants";
import { PageTemplate } from "@/components/pages/page-template";
import { Spinner } from "@/components/Spinner";
import {
  useAccount
} from "@particle-network/connectkit";

export default function Library() {
  const { address } = useAccount()
  const {
    data,
    isLoading: isDataLoading,
    isFetching,
    refetchBooks,
  } = useMyBooks({ accountId: address, contractAddress: constants.tokenContractAddress });


  useEffect(() => {
    refetchBooks();
  }, [address]);


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