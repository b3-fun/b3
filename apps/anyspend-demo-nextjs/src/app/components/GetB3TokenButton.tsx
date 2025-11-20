import { B3_TOKEN } from "@b3dotfun/sdk/anyspend";
import { useModalStore } from "@b3dotfun/sdk/global-account/react";

export function GetB3TokenButton() {
  const setB3ModalOpen = useModalStore(state => state.setB3ModalOpen);
  const setB3ModalContentType = useModalStore(state => state.setB3ModalContentType);

  return (
    <button
      onClick={() => {
        setB3ModalOpen(true);
        setB3ModalContentType({
          type: "anySpend",
          destinationTokenAddress: B3_TOKEN.address,
          destinationTokenChainId: B3_TOKEN.chainId,
          clientReferenceId: "demo-get-b3-token",
        });
      }}
      className="group flex h-40 flex-col justify-between overflow-hidden rounded-lg border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:border-indigo-100 hover:shadow-md"
    >
      <div>
        <h3 className="text-lg font-medium text-gray-900">Get B3 Token</h3>
        <p className="mt-1 text-sm text-gray-500">Purchase B3 tokens directly through AnySpend</p>
      </div>
    </button>
  );
}
