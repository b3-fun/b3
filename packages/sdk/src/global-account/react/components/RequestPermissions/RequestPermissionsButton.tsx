import { Button, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { PermissionsConfig } from "@b3dotfun/sdk/global-account/types/permissions";

type RequestPermissionsButtonProps = {
  chain: any;
  sessionKeyAddress: `0x${string}`;
  onSuccess?: () => void;
  onError?: (error: Error) => Promise<void>;
  permissions?: PermissionsConfig;
  closeOnSuccess?: boolean;
};

export function RequestPermissionsButton({
  chain,
  sessionKeyAddress,
  onSuccess,
  onError,
  permissions,
  closeOnSuccess = true,
}: RequestPermissionsButtonProps) {
  const { setB3ModalOpen, setB3ModalContentType } = useModalStore();

  const handleClick = () => {
    setB3ModalContentType({
      type: "requestPermissions",
      chain,
      sessionKeyAddress,
      onSuccess: () => {
        onSuccess?.();
        if (closeOnSuccess) {
          setB3ModalOpen(false);
        }
      },
      onError,
      permissions,
    });
    setB3ModalOpen(true);
  };

  return (
    <Button
      onClick={handleClick}
      style={{ backgroundColor: "#3368ef" }}
      className="flex items-center gap-2 font-medium text-white"
    >
      <span>Request Permissions</span>
      <img src="https://cdn.b3.fun/b3_logo_white.svg" alt="B3 Logo" className="h-5 w-6" />
    </Button>
  );
}
