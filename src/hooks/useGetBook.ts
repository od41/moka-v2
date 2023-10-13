import { useGraphQlQuery } from "@/data/useGraphQlQuery";
import { constants } from "@/constants";
import { useMemo } from "react";

/* 
query MyQuery {
  books: mb_views_nft_tokens(
    where: {nft_contract_id: {_eq: "bookpublisher.mintspace2.testnet"}, metadata_id: {_eq: "bookpublisher.mintspace2.testnet:8200f898689a761ba6d025c49af05a11"}}
  ) {
    id: token_id
    title
    owner
    nft_contract_id
    metadata_id
    copies
    nft_contract_owner_id
  }
}

*/

const FetchBookQueryWithAccount = `
  query FetchBook($accountId: String, $contractAddress: String, $metadataId: String) @cached {
    book: mb_views_nft_tokens(
      where: { owner: {_eq: $accountId},  nft_contract_id: { _eq: $contractAddress }, metadata_id: {_eq: $metadataId} }
      limit: 1
    ) {
        id: token_id
        media
        title
        description
        metadata_id
        attributes {
          attribute_display_type
          attribute_value
        }
        reference_blob
    }
  }
`;

const FetchBookQueryNoAccount = `
  query FetchBookNoAccount($contractAddress: String, $metadataId: String) @cached {
    book: mb_views_nft_tokens(
      where: { nft_contract_id: { _eq: $contractAddress }, metadata_id: {_eq: $metadataId} }
      limit: 1
    ) {
        id: token_id
        media
        title
        description
        metadata_id
        attributes {
          attribute_display_type
          attribute_value
        } 
        reference_blob
    }
  }
`;

export const useGetBook = (props: any) => {
  const { accountId, metadataId } = props;
  const fullMetadataId = constants.tokenContractAddress + ":" + metadataId

  const queryObjWithAccount = {
    queryName: "FetchBook",
    query: FetchBookQueryWithAccount,
    variables: { accountId: accountId, contractAddress: constants.tokenContractAddress, metadataId: fullMetadataId },
    queryOpts: { staleTime: Infinity },
  };

  const queryObjNoAccount = {
    queryName: "FetchBookNoAccount",
    query: FetchBookQueryNoAccount,
    variables: {contractAddress: constants.tokenContractAddress, metadataId: fullMetadataId },
    queryOpts: { staleTime: Infinity },
  };
  
  const {
    error,
    data,
    isLoading,
    isFetching,
    refetch: refetchBook,
  } = useGraphQlQuery(accountId == "" ? queryObjNoAccount : queryObjWithAccount);

  const memoizedData = useMemo((): any[] => {  
    return data;
  }, [data, metadataId]);

  return { data, isLoading, refetchBook }
}

