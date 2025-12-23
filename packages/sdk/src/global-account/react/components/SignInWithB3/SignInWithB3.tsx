import {
  Button,
  SignInWithB3ModalProps,
  StyleRoot,
  useAuthentication,
  useAuthStore,
  useIsMobile,
  useModalStore,
} from "@b3dotfun/sdk/global-account/react";
import { ReactNode, useEffect } from "react";
import { useB3Account } from "../B3Provider/useB3Account";
import { ManageAccountButton } from "../custom/ManageAccountButton";
import { Loading } from "../ui/Loading";

export type SignInWithB3Props = Omit<SignInWithB3ModalProps, "type" | "showBackButton"> & {
  buttonText?: string | ReactNode;
  loggedInButtonText?: string | ReactNode;
  loadingButtonText?: string | ReactNode;
  withLogo?: boolean;
};

export function SignInWithB3(props: SignInWithB3Props) {
  const { logout } = useAuthentication(props.partnerId);
  const { setB3ModalOpen, setB3ModalContentType, setEcoSystemAccountAddress } = useModalStore();
  const account = useB3Account();
  const { isAuthenticating, isAuthenticated } = useAuthStore();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (account) {
      setEcoSystemAccountAddress(account.address as `0x${string}`);
    }
  }, [account, setEcoSystemAccountAddress]);

  const handleClick = async () => {
    //  FIXME: This is a hack to force logout the user before signing in with B3
    //  to prevent issue with setActiveWallet
    await logout();
    setB3ModalContentType({
      ...props,
      type: "signInWithB3",
      showBackButton: false,
    });
    setB3ModalOpen(true);
  };

  if (isAuthenticated) {
    return <ManageAccountButton {...props} />;
  }

  if (isAuthenticating) {
    return (
      <StyleRoot>
        <Button disabled style={{ backgroundColor: "#3368ef" }} className="flex items-center gap-2 text-white">
          {props.withLogo !== false && (
            <img src="https://cdn.b3.fun/b3_logo_white.svg" alt="B3 Logo" className="h-5 w-5" />
          )}
          {props.loadingButtonText || (isMobile ? <Loading size="sm" /> : "Signing in…")}
        </Button>
      </StyleRoot>
    );
  }

  return (
    <StyleRoot>
      <Button
        onClick={handleClick}
        style={{ backgroundColor: "#3368ef" }}
        className="b3-sign-in-button flex items-center gap-2 font-medium text-white"
      >
        {props.buttonText ? (
          props.buttonText
        ) : (
          <>
            <span>Sign in with</span>
            {props.withLogo !== false && (
              <img src="https://cdn.b3.fun/b3_logo_white.svg" alt="B3 Logo" className="h-5 w-6" />
            )}
          </>
        )}
      </Button>
    </StyleRoot>
  );
}
