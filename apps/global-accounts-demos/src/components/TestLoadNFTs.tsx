import { useTokensFromAddress, useModalStore } from "@b3dotfun/sdk/global-account/react";

export function TestLoadNFTs() {
  const store = useModalStore();
  const ecoSystemAccount = { address: store.ecoSystemAccountAddress }; // workaround for thirdweb provider not syncing between React SDK and here

  const { data: response } = useTokensFromAddress({
    ownerAddress: ecoSystemAccount.address,
    chain: 8333,
    limit: 50
  });
  console.log("useTokensFromAddress response", response);

  return <div>{response?.data.map(token => <div key={token.tokenId}>{token.name}</div>)}</div>;
}
