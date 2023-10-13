import { FinalExecutionOutcome } from '@mintbase-js/auth';
import { useWallet, useNearPrice } from '@mintbase-js/react';
import { buy, execute, TransactionSuccessEnum } from '@mintbase-js/sdk';
import {
  EState,
  MbAmountInput,
  MbInfoCard,
  MbText,
} from 'mintbase-ui';
import { useApp } from "@/providers/app";

/*
Buy Modal Info:
The component that handles the NFT Buy Information
*/

import { useState } from 'react'; 
import { nearToYocto } from '@/lib/numbers';
import { TokenListData } from '@/types/types';
import { serif } from '@/app/layout';

function AvailableNftComponent({
  data,
}: {
  data: Partial<TokenListData>
}): JSX.Element {
  const {
    amountAvailable,
    marketId,
    nftContractId,
    price,
    tokenId,
    tokensTotal,
    isTokenListLoading,
  } = data;
  const { openModal } = useApp();

  const { selector, isConnected } = useWallet();

  const message = `${amountAvailable} of ${tokensTotal} Available`;
  // state to check the price x amount according to user interaction

  const [currentPrice, setCurrentPrice] = useState(price);
  const [amount, setAmount] = useState(1);

  const {nearPrice} = useNearPrice();

  const callback = {
    type: TransactionSuccessEnum.MAKE_OFFER,
    args: {
      tokenId,
      // @ts-ignore
      price: nearToYocto(currentPrice.toString()),
    },
  };

  const singleBuy = async () => {
    const wallet = await selector.wallet();

    await execute(
      { wallet, callbackArgs: callback },
      {
        ...buy({
          contractAddress: nftContractId,
          // @ts-ignore
          tokenId,
          // affiliateAccount:
          //   process.env.NEXT_PUBLIC_AFFILIATE_ACCOUNT
          //   || MAINNET_CONFIG.affiliate,
          marketId,
          // @ts-ignore
          price: nearToYocto(currentPrice.toString()),
        }),
      },
    ) as FinalExecutionOutcome;
  };

  // handler function to call the wallet methods to proceed the buy.
  const handleBuy = async () => {
    const isSingleAmount = amount === 1;

    if (isSingleAmount) {
      await singleBuy();
    }
  };

  const setNewPrice = (val: string) => {
    const value = Number(val);

    setAmount(value);
    // @ts-ignore
    setCurrentPrice(price * value);
  };

  return isConnected && !isTokenListLoading ? (
    <div className="mt-2">
      {/* <div className="bg-gray-50 py-4 text-center">
        <MbText className="p-med-90 text-gray-700">
          <span className="p-med-130 text-black">{message}</span>
        </MbText>
      </div> */}
      <div className="py-2">
        <div className="mb-8">
          <MbInfoCard
            boxInfo={{
              // @ts-ignore
              description: `${currentPrice.toFixed(2)} N`,
              title: 'Price',
              lowerLeftText: `~ ${(
                Number(nearPrice) * Number(currentPrice)
              ).toFixed(2)} USD`,
            }}
          />
          <div className="mt-4">
            <MbText className="text-gray-700 mb-2">Quantity</MbText>
            <MbAmountInput
              // @ts-ignore
              maxAmount={Math.min(amountAvailable, 1)}
              onValueChange={(e) => {
                setNewPrice(e);
              }}
              disabled={amountAvailable === 1}
            />
          </div>
        </div>
        <div className="text-center">
          <button onClick={handleBuy} className="w-full mt-4 bg-[#3F305B] hover:bg-[#614F82] uppercase font-semibold text-sm text-white py-3 rounded-full">Buy with NEAR</button>
        </div>
      </div>
    </div>
  ) : (
    <>
      <button className="border px-2 py-1 rounded-full" onClick={() => openModal("default")}>
        {isConnected ? "Connected" : "Connect Wallet"}
      </button>
    </>
  );
}

export function BuyModalInfo({
  data,
}: {
  data: Partial<TokenListData>
}): JSX.Element {
  // @ts-ignore
  if (!(data?.amountAvailable > 0)) {
    return (
      <div className="mt-2">
        <div className="bg-gray-50 py-4 text-center">
          {/* <MbText className="p-med-90 text-gray-700"> */}
            <span style={serif.style} className="text-gray-900 text-xl">Book is Unavailable</span>
          {/* </MbText> */}
        </div>
      </div>
    );
  }

  return <AvailableNftComponent data={data} />;
}
