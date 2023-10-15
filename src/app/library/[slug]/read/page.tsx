"use client";
import { useState, useEffect } from "react";
import { useGetBook } from "@/hooks/useGetBook";
import { EpubReader } from "@/components/pages/epub-reader";
import { useWallet } from "@mintbase-js/react";
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


export default function BookReader({ params }: { params: { slug: string } }) {
  const [error, setError] = useState(false);
  const [bookData, setBookData] = useState(undefined)
  const { activeAccountId } = useWallet()

  // get book data
  const args = {
    accountId: activeAccountId, // @TODO: replace with whatever account is signed in
    metadataId: params.slug
  }
  
  // check if account owns this book or has access in other ways, else, revert
  const {data, isLoading, refetchBook} = useGetBook(args)

  useEffect(() => {
    refetchBook();
  }, [activeAccountId]);

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