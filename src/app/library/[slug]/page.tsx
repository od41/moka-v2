"use client";
import { useEffect, useState } from "react";
import { useGetBook } from "@/hooks/useGetBook";
import Image from "next/image";
import { useWallet } from "@mintbase-js/react";
import { useRouter } from "next/navigation";
import { useApp } from "@/providers/app";
import BookDetailsTemplate from '@/components/pages/book-details'
import { Spinner } from "@/components/Spinner";

export default function BookDetails({ params }: { params: { slug: string } }) {
  const [error, setError] = useState(false);
  const [bookData, setBookData] = useState<any>({});
  const [isPageLoading, setIsPageLoading] = useState(true)
  const { activeAccountId, isConnected } = useWallet()
  const { push } = useRouter();
  const { openModal } = useApp();



  // get book data
  const args = {
    accountId: isConnected ? activeAccountId : "",
    metadataId: params.slug
  }

  const { data, isLoading } = useGetBook(args);

  const handleError = () => {
    setError(true);
  };


  useEffect(() => {
    if (data || !isLoading) {
      setIsPageLoading(false)
      setBookData(data?.data?.book[0])
    }
  }, [data, isLoading])

  // display a loading UI
  if (isPageLoading) {
    return <Spinner />
  }

  // require user to login logged in
  if (!isConnected) {
    openModal("default");
    return <></>;
  }
  
  if (!bookData && isConnected) {
    alert("you don't own this book")
    push(`/`) // send back to home / store
    return <></>
  }

  return (
  <>
    <BookDetailsTemplate bookData={data?.data?.book[0]} isLoading={isLoading} params={params} isOwned={true} />
  </>);
}