import { useMemo, useEffect } from "react";
import { useGraphQlQuery } from "@/data/useGraphQlQuery";

export const FETCH_MY_BOOKS = `
query fetch_my_books($accountId: String!, $contractAddress: String) {
  token: mb_views_nft_tokens(
    where: {owner: {_eq: $accountId}, nft_contract_id: {_eq: $contractAddress}}
    order_by: {last_transfer_timestamp: desc}
  ) {
    id: token_id
    createdAt: minted_timestamp
    media
    title
    description
    metadata_id
    attributes {
      attribute_type
      attribute_value
    }
  }
}
`;

const useMyBooks = (props: any) => {
  const { accountId, contractAddress } = props;

  const queryObj = {
    queryName: "fetch_my_books",
    query: FETCH_MY_BOOKS,
    variables: { accountId, contractAddress },
    queryOpts: { staleTime: Infinity },
  };

  const {
    data,
    isLoading,
    isFetching,
    refetch: refetchBooks,
  } = useGraphQlQuery(queryObj);

  const memoizedData = useMemo(() => {
    const uniqueMetadataIds = new Set<string>();

    const filteredData =  data?.data?.token?.filter((token: any) => {
      if (uniqueMetadataIds.has(token.metadata_id)) {
        return false;
      }

      uniqueMetadataIds.add(token.metadata_id);

      return true;
    });

    return filteredData;
  }, [data]);

  

  return {
    data: memoizedData,
    isLoading,
    isFetching,
    refetchBooks,
  };
};

export { useMyBooks };
