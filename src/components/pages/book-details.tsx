"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useWallet } from "@mintbase-js/react";
import { useRouter } from "next/navigation";
import { useApp } from "@/providers/app";
import BuyModal from "@/components/buy-modal/BuyModal"
import { serif } from "@/app/layout";
import { Spinner } from "../Spinner";

interface BookDetailsTemplateProps {
    bookData: any;
    isLoading: boolean;
    isOwned?: boolean;
    params: {slug: string}
}

export default function BookDetailsTemplate({ params, isOwned = false, bookData, isLoading }: BookDetailsTemplateProps) {
  const [error, setError] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const { openModal } = useApp();
  const { push } = useRouter();

  const handleError = () => {
    setError(true);
  };

  const handleCloseBuyModal = () => {
    setShowBuyModal(false);
  };

  const handleBuy = (metadataId: string) => {
    setShowBuyModal(true);
  }

  const handleRead = () => push(`/library/${params.slug}/read`)

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

  return (
    <main className="mt-[72px] px-4 lg:px-12 mx-auto flex flex-col items-center justify-center space-y-4 md:mb-8">
      <div>
        <div className="grid grid-cols-1 md:grid-cols-[45%_1fr] gap-8">
          <Image
            key={params.slug}
            src={bookData.media}
            alt={`Book ${bookData.title}`}
            className="object-cover h-full w-full col-span-1 rounded"
            width={320}
            height={320}
            quality={70}
            priority={true}
            onError={handleError}
            placeholder="blur"
            blurDataURL={rgbDataURL(237, 181, 6)}
          />

          <div className="col-span-auto md:mt-4">
            <h3 style={serif.style} className="text-xl lg:text-2xl leading-tight mb-2 text-gray-800">{bookData.title} </h3>
            <p className="text-md leading-relaxed text-gray-600">{bookData.description}</p>
            {isOwned ? <>
            <button onClick={handleRead} className="w-full mt-4 bg-[#3F305B] hover:bg-[#614F82] uppercase font-semibold text-sm text-white py-3 rounded-full">Read</button>
          </>
          : <>
            <button onClick={() => handleBuy(bookData.metadata_id)} className="w-full mt-4 bg-[#3F305B] hover:bg-[#614F82] uppercase font-semibold text-sm text-white py-3 rounded-full">Buy</button>
            </>
          }
          </div>
          <div className="mx-24">
        {!!showBuyModal && (
          <BuyModal closeModal={handleCloseBuyModal} item={{ metadataId: bookData.metadata_id }} />
        )}
      </div>
          
          
        </div>
      </div>
    </main>
  );
}