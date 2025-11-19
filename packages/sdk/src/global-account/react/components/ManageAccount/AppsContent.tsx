import {
  Button,
  TWSignerWithMetadata,
  useGetAllTWSigners,
  useRemoveSessionKey,
} from "@b3dotfun/sdk/global-account/react";
import { formatNumber } from "@b3dotfun/sdk/shared/utils/formatNumber";
import { useState } from "react";
import { Chain } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { formatUnits } from "viem";

const AppsContent = ({ chain, partnerId: _partnerId }: { chain: Chain; partnerId: string }) => {
  const [revokingSignerId, setRevokingSignerId] = useState<string | null>(null);
  const account = useActiveAccount();

  const { data: signers, refetch: refetchSigners } = useGetAllTWSigners({
    chain,
    accountAddress: account?.address,
  });

  const { removeSessionKey } = useRemoveSessionKey({
    chain,
    onSuccess: tx => {
      console.log("@@removeSessionKey:tx", tx);
      setRevokingSignerId(null);
    },
    onError: error => {
      console.error("Error revoking access:", error);
      setRevokingSignerId(null);
    },
    refetchSigners: () => refetchSigners(),
  });

  const handleRevoke = async (signer: TWSignerWithMetadata) => {
    setRevokingSignerId(signer.id);
    await removeSessionKey(signer);
  };

  return (
    <div className="space-y-4">
      {signers?.map((signer: TWSignerWithMetadata) => (
        <div key={signer.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">App</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">{signer.partner.name}</h3>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-gray-500">Added {new Date(signer.createdAt).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-500">
                    Expires {new Date(Number(signer.endTimestamp) * 1000).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Max spend: {formatNumber(Number(formatUnits(signer.nativeTokenLimitPerTransaction, 18)))} ETH
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-red-200 text-red-500 hover:border-red-300 hover:text-red-600"
              onClick={() => handleRevoke(signer)}
              disabled={revokingSignerId === signer.id}
            >
              {revokingSignerId === signer.id ? "Revoking..." : "Revoke"}
            </Button>
          </div>
        </div>
      ))}

      {!signers?.length && <div className="py-12 text-center text-gray-500">No connected apps</div>}
    </div>
  );
};
export default AppsContent;
