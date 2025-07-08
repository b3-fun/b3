import {
  SignInWithB3,
  SignInWithB3ModalProps,
  StyleRoot,
  useAccountWallet,
  useAuthentication,
  useB3,
  useIsMobile
} from "@b3dotfun/sdk/global-account/react";
import Icon from "@b3dotfun/sdk/global-account/react/components/custom/Icon";
import { ecosystemWalletId } from "@b3dotfun/sdk/shared/constants";
import { cn, truncateAddress } from "@b3dotfun/sdk/shared/utils";
import { Menu, MenuButton, MenuItems, Transition } from "@headlessui/react";
import { ReactNode, useEffect } from "react";
import { useConnectedWallets, useSetActiveWallet, useWalletInfo } from "thirdweb/react";
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
  const { automaticallySetFirstEoa } = useB3();
  const {
    wallet,
    address: globalAddress,
    ensName,
    connectedSmartWallet,
    connectedEOAWallet,
    isActiveSmartWallet,
    isActiveEOAWallet,
    smartWalletIcon,
    eoaWalletIcon
  } = useAccountWallet();

  const isMobile = useIsMobile();
  const { logout } = useAuthentication(String(process.env.NEXT_PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID));
  const onDisconnect = async () => {
    await logout();
  };

  const connectedWallets = useConnectedWallets();

  const { data: walletInfo } = useWalletInfo(isActiveSmartWallet ? connectedSmartWallet?.id : connectedEOAWallet?.id);

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

  // Desktop version - original dropdown menu
  return (
    <StyleRoot>
      <Menu className={`relative flex items-center ${className || ""}`} as="div">
        {globalAddress ? (
          <>
            <MenuButton className="bg-theme-on-surface-2 group flex h-10 items-center gap-1 rounded-xl px-3">
              {!!wallet.meta?.icon && (
                <img
                  src={wallet.meta.icon}
                  alt={wallet.meta.icon}
                  className="bg-theme-primary h-6 w-6 rounded-full object-cover opacity-100"
                />
              )}
              <div className="text-body-1m text-theme-secondary">
                {ensName ? ensName : truncateAddress(globalAddress)}
              </div>
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
                className="b3-root shadow-depth-1 absolute -right-4 top-full min-w-64 rounded-2xl border lg:right-0"
                modal={false}
                // TODO: Figure out why setting anchor on mobile causes z-index issues where it appears under elements
                anchor={isMobile ? "top end" : undefined}
              >
                <div className="bg-b3-react-background">
                  {connectedEOAWallet ? (
                    <div
                      className={cn(
                        "border-b3-react-subtle bg-b3-react-background flex cursor-pointer items-center justify-between rounded-xl p-3",
                        "hover:bg-theme-on-surface-2"
                      )}
                      onClick={() => handleSetActiveAccount(connectedEOAWallet?.id)}
                    >
                      <div className="flex items-center">
                        <img
                          className="bg-theme-primary h-16 w-16 rounded-full opacity-100"
                          src={eoaWalletIcon}
                          alt={connectedEOAWallet?.id}
                        />
                        <div className="ml-4 grow">
                          {ensName && <div className="text-title-1s">{ensName}</div>}
                          <div className="text-title-1s">{truncateAddress(globalAddress)}</div>
                          <div className="text-body-1m text-theme-secondary">{walletInfo?.name}</div>
                        </div>
                      </div>
                      {isActiveEOAWallet && <Icon className="fill-theme-primary" name="check" />}
                    </div>
                  ) : (
                    connectedSmartWallet && (
                      <div
                        className={cn(
                          "mb-2 flex cursor-pointer items-center justify-between rounded-xl p-3",
                          isActiveSmartWallet ? "bg-theme-n-8" : "bg-b3-react-background hover:bg-theme-on-surface-2"
                        )}
                        onClick={() => handleSetActiveAccount(connectedSmartWallet?.id)}
                      >
                        <div className="flex items-center">
                          <img
                            className="bg-theme-primary h-16 w-16 rounded-full opacity-100"
                            src={smartWalletIcon}
                            alt={connectedSmartWallet?.id}
                          />
                          <div className="pl-4.5 grow">
                            {ensName && <div className="text-title-1s">{ensName}</div>}
                            <div className="text-title-1s">{truncateAddress(globalAddress)}</div>
                            <div className="text-body-1m text-theme-secondary">Smart wallet</div>
                          </div>
                        </div>
                        {isActiveSmartWallet && <Icon className="fill-theme-primary" name="check" />}
                      </div>
                    )
                  )}

                  <div className="ml-3">
                    <ManageAccountButton {...props} className="w-[calc(100%-12px)]" />
                  </div>

                  <button className="mb-2 w-full space-y-1" onClick={onDisconnect}>
                    <div className="hover:bg-theme-on-surface-2 group flex h-12 items-center rounded-xl px-4 transition-colors">
                      <Icon
                        className="fill-theme-secondary group-hover:fill-theme-primary mr-4 shrink-0 transition-colors"
                        name="logout"
                      />
                      <div className="text-base-1s text-theme-secondary group-hover:text-theme-primary mr-auto transition-colors">
                        Disconnect
                      </div>
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
