"use client";

import React, { useEffect, useState } from "react";
import { constants } from "@/constants";

import Image from "next/image";
import Link from "next/link";
import { removeItemsBeforeColon } from "@/utils/removeItemsBeforeColon";
import { serif } from "@/app/layout";

import { PriceInUsd } from "./price-in-usd";

interface BookThumbProps {
  token: any;
  index: number;
  isOwned?: boolean;
}

const BookThumb = ({ token, index, isOwned=false }: BookThumbProps) => {
  const imageUrl = token?.media;
  const {title, description, createdAt, attributes} = token
  const author = attributes[0].attribute_value
  const datePublished = new Date(createdAt)
  const printAbleDate = new Intl.DateTimeFormat("en-US", {month: "short", year: "numeric"}).format(datePublished)
  const [error, setError] = useState(false);

  const handleError = () => {
    setError(true);
  };

  if (error)
    return (
      <div className=" aspect-square flex flex-wrap	 p-10 w-72 h-72 xl:w-80 xl:h-80 relative justify-center items-center text-center bg-gray-200 w-full">
        <div>
          <h1 className="w-full"> No Image Metadata</h1>
          <p className="text-xs text-gray-600 w-full">
            There was an Error with the image.
          </p>
        </div>
      </div>
    );

  if (imageUrl) {
    return (
      <div className="w-full h-auto relative">
        <Link
          key={`${token?.metadata_id}-${index}`}
          href={
            isOwned ? `/library/${removeItemsBeforeColon(token?.metadata_id)}`
            : `/store/${removeItemsBeforeColon(token?.metadata_id)}`
          } // @TODO: If the book is owned, redirect to library, by default, it should go to the store view
          rel="noopener noreferrer"
          passHref
        >
          <div className="aspect-[1/1.45] h-auto relative">
            <Image
              key={token?.metadata_id}
              src={imageUrl}
              alt={`Token ${index}`}
              className="object-cover rounded"
              fill={true}
              quality={70}
              priority={index < 5}
              onError={handleError}
              placeholder="empty"
            />
          </div>
          

          
          <div className="w-full flex flex-col gap-1 mt-4">
            <h3 style={serif.style} className="text-[15px] md:text-xl lg:text-2xl leading-tight text-gray-800">{title}</h3>
            <div className="text-[13px] md:text-lg lg:text-xl leading-snug text-gray-400">{author}</div>
            <div className="flex justify-between items-center w-full">
              <span className="text-[13px] md:text-lg lg:text-xl text-gray-400">{printAbleDate}</span>
              {!isOwned && <PriceInUsd price={token?.price} />}
            </div>
          </div>
        </Link>
      </div>
    );
  } else {
    return null;
  }
};

export const MemoizedBookThumb = React.memo(BookThumb);
