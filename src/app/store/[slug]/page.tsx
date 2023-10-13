"use client";
import { useEffect, useState } from "react";
import { useGetBook } from "@/hooks/useGetBook";
import Image from "next/image";
import { useWallet } from "@mintbase-js/react";
import { useRouter } from "next/navigation";
import { useApp } from "@/providers/app";
import BuyModal from "@/components/buy-modal/BuyModal"
import { serif } from "@/app/layout";
import BookDetailsTemplate from "@/components/pages/book-details";
import { Spinner } from "@/components/Spinner";

export default function BookDetails({ params }: { params: { slug: string } }) {
  const [error, setError] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [bookData, setBookData] = useState<any>({});
  const [isPageLoading, setIsPageLoading] = useState(true)
  const { isConnected } = useWallet()
  const { openModal } = useApp();



  // get book data
  const args = {
    accountId: "", // this uses the gql query without the accountId filter
    metadataId: params.slug
  }

  const { data, isLoading } = useGetBook(args);

  const handleError = () => {
    setError(true);
  };

  const handleCloseBuyModal = () => {
    setShowBuyModal(false);
  };

  const handleBuy = (metadataId: string) => {
    setShowBuyModal(true);
  }

  // Pixel GIF code adapted from https://stackoverflow.com/a/33919020/266535
  const keyStr =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='

  const triplet = (e1: number, e2: number, e3: number) =>
    keyStr.charAt(e1 >> 2) +
    keyStr.charAt(((e1 & 3) << 4) | (e2 >> 4)) +
    keyStr.charAt(((e2 & 15) << 2) | (e3 >> 6)) +
    keyStr.charAt(e3 & 63)

  const rgbDataURL = (r: number, g: number, b: number) =>
    `data:image/gif;base64,R0lGODlhAQABAPAA${triplet(0, r, g) + triplet(b, 255, 255)
    }/yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==`


  useEffect(() => {
    if (data || !isLoading) {
      setIsPageLoading(false)
      // @ts-ignore
      setBookData(data?.data?.book[0])
    }
  }, [data, isLoading])

  // display a loading UI
  if (isPageLoading) {
    return <Spinner />
  }

  // exit if the user isn't logged in
  if (!isConnected) {
    openModal("default");
    return <></>;
  }

  return (<>
    <BookDetailsTemplate bookData={data?.data?.book[0]} isLoading={isLoading} params={params} isOwned={false} />
    </>
  );
}