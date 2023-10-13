import { useMemo } from "react";
import { useGraphQlQuery } from "@/data/useGraphQlQuery";


const FETCH_LISTED_TOKENS = `
query minsta_fetch_store_feed_listed_tokens($contractAddress: String, $limit: Int, $offset: Int) {
  metadata: mb_views_nft_tokens(
      where: {
        nft_contract_id: { _eq: $contractAddress }
      }
      order_by: { minted_timestamp: desc,  metadata_id: asc },
       offset: $offset,
       limit: $limit,
    	 distinct_on: metadata_id
    ) {
      id: token_id
      createdAt: minted_timestamp
      media
      title
      description
      metadata_id
      attributes {
        attribute_display_type
        attribute_value
      } 
    }
  tokens: mb_views_nft_tokens_with_listing(
    where: {nft_contract_id: {_eq: $contractAddress}}
    order_by: {minted_timestamp: desc, metadata_id: asc}
    offset: $offset
    limit: $limit
    distinct_on: metadata_id
  ) {
    id: token_id
    metadata_id
    price
    currency
  }
  total_listed: mb_views_nft_tokens_with_listing_aggregate(
    where: { nft_contract_id: {_eq: $contractAddress}
    }) {
      data: aggregate {
      	count
      }
    }
}
`


const useFeed = (props: any) => {
  const { accountId, contractAddress } = props;

  const queryObj = {
    queryName: "q_FETCH_FEED",
    query: FETCH_LISTED_TOKENS,
    variables: { contractAddress, limit: 100, offset: 0 },
    queryOpts: { staleTime: Infinity },
  };

  const {
    data,
    isLoading,
    isFetching,
    refetch: refetchNfts,
  } = useGraphQlQuery(queryObj);

  const memoizedData = useMemo((): any[] => {
    const mergedArray: any = [];

    const tokenData = data?.data?.tokens;
    const metadata = data?.data?.metadata;
    const totalCount = data?.data?.total_listed?.data?.count;

    if (tokenData && metadata && totalCount){
      for (const obj1 of tokenData) {
        const matchingObj2 = metadata.find((obj2: any) => obj2.metadata_id === obj1.metadata_id);
    
        if (matchingObj2) {
          // Merge properties from obj2 into obj1
          const mergedObj = {
            ...obj1,
            ...matchingObj2
          };
          mergedArray.push(mergedObj);
        }
      }
    }
  
    return mergedArray;
  }, [data]);

  return {
    data: memoizedData,
    isLoading,
    isFetching,
    refetchNfts,
  };
};

export { useFeed };
