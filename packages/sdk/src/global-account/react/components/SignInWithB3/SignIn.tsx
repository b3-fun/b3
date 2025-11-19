import {
  IPFSMediaRenderer,
  SignInWithB3,
  SignInWithB3ModalProps,
  StyleRoot,
  useAccountWallet,
  useAuthentication,
  useB3,
  useIsMobile,
} from "@b3dotfun/sdk/global-account/react";
import Icon from "@b3dotfun/sdk/global-account/react/components/custom/Icon";
import { ecosystemWalletId } from "@b3dotfun/sdk/shared/constants";
import { cn, truncateAddress } from "@b3dotfun/sdk/shared/utils";
import { Menu, MenuButton, MenuItems, Transition } from "@headlessui/react";
import { ReactNode, useEffect } from "react";
import { useConnectedWallets, useSetActiveWallet } from "thirdweb/react";
import { useAccountWalletImage } from "../../hooks/useAccountWallet";
import { ManageAccountButton } from "../custom/ManageAccountButton";

type SignInProps = {
  className?: string;
  isMobile?: boolean;
};

type SignInWithB3Props = Omit<SignInWithB3ModalProps, "type" | "showBackButton"> & {
  buttonText?: string | ReactNode;
  loggedInButtonText?: string | ReactNode;
  loadingButtonText?: string | ReactNode;
  withLogo?: boolean;
} & SignInProps;

export function SignIn(props: SignInWithB3Props) {
  const { className } = props;
  const { automaticallySetFirstEoa, partnerId } = useB3();
  const {
    address: globalAddress,
    ensName,
    connectedSmartWallet,
    connectedEOAWallet,
    isActiveSmartWallet,
    isActiveEOAWallet,
    smartWalletIcon,
    eoaWalletIcon,
  } = useAccountWallet();

  const isMobile = useIsMobile();
  const { logout } = useAuthentication(partnerId);
  const onDisconnect = async (): Promise<void> => {
    await logout();
  };

  const connectedWallets = useConnectedWallets();

  const setActiveWallet = useSetActiveWallet();

  const handleSetActiveAccount = (selectedWalletId: string | undefined) => {
    if (
      !selectedWalletId ||
      !connectedWallets ||
      !connectedEOAWallet ||
      !connectedSmartWallet ||
      !automaticallySetFirstEoa
    )
      return;
    setActiveWallet(selectedWalletId === ecosystemWalletId ? connectedSmartWallet : connectedEOAWallet);
  };

  // Automatically set EOA wallet as active when available
  useEffect(() => {
    if (connectedEOAWallet && automaticallySetFirstEoa) {
      setActiveWallet(connectedEOAWallet);
    }
  }, [connectedEOAWallet, isActiveEOAWallet, setActiveWallet, automaticallySetFirstEoa]);

  const walletImage = useAccountWalletImage();

  // Desktop version - original dropdown menu
  return (
    <StyleRoot>
      <Menu className={`relative flex items-center ${className || ""}`} as="div">
        {globalAddress ? (
          <>
            <MenuButton className="bg-b3-react-background group flex h-10 items-center gap-1 rounded-xl px-3 focus:outline-none">
              {!!walletImage && (
                <IPFSMediaRenderer
                  src={walletImage}
                  alt="Wallet Image"
                  className="bg-b3-react-primary h-6 w-6 rounded-full object-cover opacity-100"
                />
              )}
              <div className="text-as-primary">{ensName ? ensName : truncateAddress(globalAddress)}</div>
            </MenuButton>
            <Transition
              enter="duration-200 ease-out"
              enterFrom="scale-95 opacity-0"
              enterTo="scale-100 opacity-100"
              leave="duration-300 ease-out"
              leaveFrom="scale-100 opacity-100"
              leaveTo="scale-95 opacity-0"
            >
              <MenuItems
                className="b3-root absolute -right-4 top-full min-w-64 rounded-2xl border focus:outline-none lg:right-0"
                modal={false}
                // TODO: Figure out why setting anchor on mobile causes z-index issues where it appears under elements
                anchor={isMobile ? "top end" : undefined}
              >
                <div className="bg-b3-react-background">
                  {connectedEOAWallet ? (
                    <div
                      className={cn(
                        "border-b3-react-subtle bg-b3-react-background flex cursor-pointer items-center justify-between rounded-xl p-3",
                      )}
                      onClick={() => handleSetActiveAccount(connectedEOAWallet?.id)}
                    >
                      <div className="flex items-center">
                        <img
                          className="bg-b3-react-primary h-16 w-16 rounded-full opacity-100"
                          src={eoaWalletIcon}
                          alt={connectedEOAWallet?.id}
                        />
                        <div className="ml-4 grow">
                          {ensName && <div>{ensName}</div>}
                          <div>{truncateAddress(globalAddress)}</div>
                          {/* <div>{walletInfo?.name}</div> */}
                        </div>
                      </div>
                      {isActiveEOAWallet && <Icon className="fill-b3-react-primary" name="check" />}
                    </div>
                  ) : (
                    connectedSmartWallet && (
                      <div
                        className={cn(
                          "mb-2 flex cursor-pointer items-center justify-between rounded-xl p-3",
                          isActiveSmartWallet
                            ? "bg-b3-react-background"
                            : "bg-b3-react-background hover:bg-b3-react-background",
                        )}
                        onClick={() => handleSetActiveAccount(connectedSmartWallet?.id)}
                      >
                        <div className="flex items-center">
                          <img
                            className="bg-b3-react-primary h-16 w-16 rounded-full opacity-100"
                            src={smartWalletIcon}
                            alt={connectedSmartWallet?.id}
                          />
                          <div className="grow pl-4">
                            {ensName && <div>{ensName}</div>}
                            <div>{truncateAddress(globalAddress)}</div>
                            <div>Smart wallet</div>
                          </div>
                        </div>
                        {isActiveSmartWallet && <Icon className="fill-b3-react-primary" name="check" />}
                      </div>
                    )
                  )}

                  <div className="ml-3">
                    <ManageAccountButton {...props} className="w-[calc(100%-12px)]" />
                  </div>

                  <button className="mb-2 w-full space-y-1" onClick={onDisconnect}>
                    <div className="hover:bg-b3-react-background group flex h-12 items-center rounded-xl px-4 transition-colors">
                      <Icon className="fill-b3-react-primary mr-4 shrink-0 transition-colors" name="logout" />
                      <div className="text-b3-react-primary mr-auto transition-colors">Disconnect</div>
                    </div>
                  </button>
                </div>
              </MenuItems>
            </Transition>
          </>
        ) : (
          <SignInWithB3
            closeAfterLogin={true}
            onLoginSuccess={async globalAccount => {
              console.log("User authenticated with Global Account!", globalAccount);
            }}
            {...props}
          />
        )}
      </Menu>
    </StyleRoot>
  );
}

export default SignIn;
