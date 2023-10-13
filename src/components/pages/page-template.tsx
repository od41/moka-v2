"use client";

import { DynamicGrid } from "@/components/DynamicGrid";
import React, { useEffect } from "react";
import { MemoizedBookThumb } from "../feed/BookThumb";
import { serif } from "@/app/layout";

interface PageTemplateProps {
    title: string;
    data: any;
    newToken?: any;
    isOwned?: boolean
    tokensFetched?: any;
    isLoading: boolean;
    blockedNfts?: any;
}

export const PageTemplate = ({title, data, isLoading, blockedNfts, isOwned}: PageTemplateProps) => {


  return (
    <>
      <main className="px-4 lg:px-12 flex flex-col items-start justify-center mb-[300px] md:mb-[120px]">
        <h1 style={serif.style} className="text-[34px] mt-[5rem]">{title}</h1>
        <hr className="w-full mt-2 mb-6" />
        <DynamicGrid nCols={2} mdCols={3} nColsXl={4} nColsXXl={6} nGap={4} nGapMobile={8}>
          {data?.length > 0 &&
            data.map((token: any, index: number) => {
            //   if (!!blockedNfts && blockedNfts.includes(token?.metadata_id)) {
            //     return null;
            //   }
              return (
                <MemoizedBookThumb
                  key={token?.metadata_id}
                  token={token}
                  index={index}
                  isOwned={isOwned ? isOwned : false}
                />
              );
            })}
        </DynamicGrid>
      </main>
    </>
  );
};
