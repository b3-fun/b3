import { Button, StyleRoot, useAuthentication, useModalStore } from "@b3dotfun/sdk/global-account/react";
import { cn } from "@b3dotfun/sdk/shared/utils";
import { SignInWithB3Props } from "../SignInWithB3/SignInWithB3";

export function ManageAccountButton(props: SignInWithB3Props & { className?: string }) {
  const { setB3ModalOpen, setB3ModalContentType } = useModalStore();
  const { isAuthenticated } = useAuthentication(props.partnerId, props.loginWithSiwe);

  const handleClickManageAccount = () => {
    setB3ModalContentType({
      ...props,
      type: "manageAccount",
    });
    setB3ModalOpen(true);
  };

  if (!isAuthenticated) return null;

  return (
    <StyleRoot>
      <Button
        onClick={handleClickManageAccount}
        style={{ backgroundColor: "#3368ef" }}
        className={cn("b3-manage-account-button flex items-center gap-2 text-white", props.className)}
      >
        {props.withLogo !== false && (
          <img src="https://cdn.b3.fun/b3_logo_white.svg" alt="B3 Logo" className="h-5 w-5" />
        )}
        {props.loggedInButtonText || "Manage Account"}
      </Button>
    </StyleRoot>
  );
}
