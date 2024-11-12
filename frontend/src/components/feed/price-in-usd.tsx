import { parseYoctoToNear } from "@/lib/numbers";
import { useState, useEffect } from "react";
import { NearSymbol } from "../near-symbol";

export const PriceInUsd = ({ price }: { price: number }) => {
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);
  const [bookPriceInUsd, setBookPriceInUsd] = useState("0");

  const nearPrice = 10; // @TODO: get real price

  useEffect(() => {
    if (nearPrice) {
      const _bookPriceInUsd = parseYoctoToNear(price) * nearPrice;
      setBookPriceInUsd(_bookPriceInUsd.toFixed(2));
      setIsLoadingPrice(false);
    }
  }, [nearPrice]);
  return (
    <>
      <span className="flex items-center text-gray-600 rounded text-[13px] md:text-lg lg:text-xl">
        ${price}
        {/* in <NearSymbol /> */}
      </span>
    </>
  );
};
