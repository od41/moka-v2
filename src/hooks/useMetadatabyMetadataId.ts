/*

 the information of the current NFT opened on the BuyModal.

*/

import { useQuery } from "@tanstack/react-query";
import { parseYoctoToNear } from "@/lib/numbers";
import { SelectedNft, TokenListData } from "@/types/types";
import { constants } from "@/constants";

const mapMetadata = (metadata: any): Partial<TokenListData> => {
  const firstListing = metadata?.data?.listings[0];

  if (!firstListing || firstListing === null) {
    return {
      amountAvailable: 0,
      tokensTotal: 0,
      price: 0,
      tokenId: undefined,
    };
  }

  const { price } = firstListing;

  const prices = metadata?.data?.listings.map((elm: any) => ({
    price: elm.price,
    tokenId: elm.token.token_id,
  }));

  return {
    amountAvailable: metadata?.data?.simpleSaleCount.aggregate.count,
    tokensTotal: metadata?.data?.tokenCount.aggregate.count,
    price: price ? parseYoctoToNear(price) : 0,
    tokenId: firstListing.token.token_id,
    // @ts-ignore
    prices: prices.length > 0 ? prices : [],
    nftContractId: firstListing.token.nft_contract_id,
    marketId: firstListing.market_id,
  };
};

const useMetadataByMetadataId = ({
  metadataId,
}: SelectedNft): Partial<TokenListData> => {
  const TESTNET = "testnet";
  const MAINNET = "mainnet";
  const network = constants.network === "testnet" ? TESTNET : MAINNET;
  const { isLoading, data: metadata } = useQuery(
    ["metadataByMetadataId"],
    // () => metadataByMetadataId(metadataId, network), // @TODO: replace this method
    () => null,
    {
      retry: false,
      refetchOnWindowFocus: false,
      select: mapMetadata,
    }
  );

  return { ...metadata, isTokenListLoading: isLoading };
};

export { useMetadataByMetadataId };
