import {
  Button,
  useB3,
  useAddTWSessionKey,
  useGetAllTWSigners,
  RequestPermissionsModalProps,
} from "@b3dotfun/sdk/global-account/react";
import { PermissionItem } from "@b3dotfun/sdk/global-account/react";
import { PermissionsConfig } from "@b3dotfun/sdk/global-account/types/permissions";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { formatAddress } from "@b3dotfun/sdk/shared/utils/formatAddress";
import { CreditCard, Eye } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import TimeAgo from "react-timeago";
import type { Address } from "thirdweb";
import { useActiveAccount } from "thirdweb/react";

const debug = debugB3React("RequestPermissions");

/**
 * Component for requesting permissions to access user accounts and contracts
 * Allows users to approve session keys with specific permission settings
 */
export function RequestPermissions({
  onSuccess,
  onError,
  chain,
  sessionKeyAddress,
  permissions,
}: RequestPermissionsModalProps) {
  const [isApproving, setIsApproving] = useState(false);
  const account = useActiveAccount();
  const { defaultPermissions } = useB3();
  const DEFAULT_PERMISSIONS = useMemo(
    () => permissions ?? (defaultPermissions as PermissionsConfig),
    [defaultPermissions, permissions],
  );

  const { refetch: refetchSigners } = useGetAllTWSigners({
    chain,
    accountAddress: account?.address,
  });
  const { newSessionKey } = useAddTWSessionKey({
    onSuccess: transactionResult => {
      console.log("@@transactionResult:", transactionResult);
      onSuccess?.();
    },
    onError: error => {
      console.error("@@error:", error);
      onError?.(error as Error);
    },
    refetchSigners: () => {
      return refetchSigners();
    },
    chain,
  });

  const handleApprove = useCallback(async () => {
    debug("@@handleApprove");
    try {
      setIsApproving(true);
      if (!sessionKeyAddress) {
        throw new Error("Session key address is required");
      }
      console.log("@@sessionKeyAddress:", sessionKeyAddress);
      await newSessionKey({
        sessionKeyAddress: sessionKeyAddress,
        approvedTargets: DEFAULT_PERMISSIONS.approvedTargets as Address[],
        nativeTokenLimitPerTransaction: DEFAULT_PERMISSIONS.nativeTokenLimitPerTransaction,
        permissionStartTimestamp: DEFAULT_PERMISSIONS.startDate,
        permissionEndTimestamp: DEFAULT_PERMISSIONS.endDate,
      });
    } catch (error) {
      console.error("@@error:", error);
      onError?.(error as Error);
    } finally {
      setIsApproving(false);
    }
  }, [DEFAULT_PERMISSIONS, newSessionKey, onError, sessionKeyAddress]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold">Allow Access</h2>
        <p className="text-b3-react-muted-foreground opacity-70">This app would like permission to:</p>
      </div>

      {/* Key Permissions Section */}
      <PermissionItem
        title="Make transactions on your behalf"
        description={
          <span>
            Up to{" "}
            <span className="text-b3-react-primary font-medium">
              {DEFAULT_PERMISSIONS.nativeTokenLimitPerTransaction} ETH
            </span>{" "}
            per transaction
          </span>
        }
        icon={<CreditCard className="h-5 w-5" />}
      />
      <PermissionItem
        title="View your account"
        description="See your wallet address and balance"
        icon={<Eye className="h-5 w-5" />}
      />

      {/* Contract Details Section */}
      <div className="bg-b3-react-card rounded-lg border p-5 py-4">
        <h3 className="mb-2 text-base font-medium">Approved Contracts</h3>
        <div className="space-y-2">
          {DEFAULT_PERMISSIONS.approvedTargets.map((target: string) => (
            <div key={target} className="flex items-center gap-2">
              <div className="bg-b3-react-background text-b3-react-muted-foreground rounded-md border px-3 py-2 font-mono text-sm">
                {formatAddress(target)}
              </div>
              <span className="text-b3-react-muted-foreground text-sm">• Game Contract</span>
            </div>
          ))}
        </div>
      </div>

      {/* Time Period Section */}
      <div className="bg-b3-react-card rounded-lg border p-5 py-4">
        <h3 className="mb-2 text-base font-medium">Permission</h3>
        <div className="space-y-1 text-sm">
          <div className="text-b3-react-muted-foreground">
            <span>{`Valid for `}</span>
            <span>
              <TimeAgo
                date={DEFAULT_PERMISSIONS.endDate}
                live={false}
                formatter={(value, unit) => {
                  if (unit === "year") {
                    return "1 year";
                  }
                  return `${value} ${unit}${value !== 1 ? "s" : ""}`;
                }}
              />
            </span>

            <span className="text-b3-react-muted-foreground ml-1 opacity-70">{` (until ${formatDate(DEFAULT_PERMISSIONS.endDate)})`}</span>
          </div>
          {DEFAULT_PERMISSIONS.startDate.getTime() > Date.now() + 5 * 60 * 1000 && (
            <div className="text-b3-react-muted-foreground">
              <span>{`Starting: `}</span>
              <span className="ml-1">{formatDate(DEFAULT_PERMISSIONS.startDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pt-4">
        <Button onClick={handleApprove} disabled={isApproving} className="w-full py-6 text-lg font-medium">
          {isApproving ? "Approving..." : "Allow Access"}
        </Button>

        <p className="text-b3-react-muted-foreground text-center text-sm">Revoke access anytime in settings</p>
      </div>
    </div>
  );
}
