"use client";
import { useState, useEffect } from "react";
import { useGetBook } from "@/hooks/useGetBook";
import { EpubReader } from "@/components/pages/epub-reader";
import {
  useAccount
} from "@particle-network/connectkit";

export default function BookReader({ params }: { params: { slug: string } }) {
  const [error, setError] = useState(false);
  const [bookData, setBookData] = useState(undefined)
  const { address } = useAccount()

  // get book data
  const args = {
    accountId: address, // @TODO: replace with whatever account is signed in
    metadataId: params.slug
  }
  
  // check if account owns this book or has access in other ways, else, revert
  const {data, isLoading, refetchBook} = useGetBook(args)

  useEffect(() => {
    refetchBook();
  }, [address]);

  useEffect(() => {
    if(data || !isLoading){
      setBookData(data.data.book[0]);
    }

  }, [data, isLoading])

  if(isLoading) {
    return <>Loading</> // @TODO: replace with nicer looking loading screen OR use the Next13 loading API?
  }

  return (<>
  {bookData ? <EpubReader 
    // @ts-ignore
    url={bookData!.reference_blob?.document} 
    // @ts-ignore
    title={bookData!.title} 
    /> 
    : <h3>Book not found</h3>
  }
    
  </>);
}