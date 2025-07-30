import { useAuthentication, useQueryB3, useAuthStore, useB3 } from "@b3dotfun/sdk/global-account/react";
import { ecosystemWalletId } from "@b3dotfun/sdk/shared/constants";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { Chain } from "thirdweb";
import { ConnectEmbed, darkTheme, lightTheme } from "thirdweb/react";
import { Account, ecosystemWallet, SingleStepAuthArgsType } from "thirdweb/wallets";
/**
 * Props for the LoginStep component
 */
interface LoginStepProps {
  /** Callback function called when login is successful */
  onSuccess: (account: Account) => Promise<void>;
  /** Optional callback function called when an error occurs */
  onError?: (error: Error) => Promise<void>;
  /** Partner ID used for authentication */
  partnerId: string;
  /** Blockchain chain information */
  chain: Chain;
  /** Optional authentication strategy options */
  strategyOptions?: SingleStepAuthArgsType;
}

interface LoginStepContainerProps {
  children: React.ReactNode;
  partnerId?: string;
}

export function LoginStepContainer({ children, partnerId }: LoginStepContainerProps) {
  const { data: partner } = useQueryB3(
    "global-accounts-partners",
    "find",
    {
      query: {
        partnerId,
        $limit: 1,
      },
    },
    !!partnerId,
  );

  const partnerLogo = partner?.data?.[0]?.loginCustomization?.logoUrl;

  return (
    <div className="flex flex-col items-center justify-center py-6">
      {partnerLogo && <img src={partnerLogo} alt="Partner Logo" className="mb-4 h-12 w-auto object-contain" />}
      {children}
      <h2 className="mt-3 flex items-center gap-2 text-lg font-bold">
        Powered by
        <img alt="B3 Logo" className="h-5" src="https://cdn.b3.fun/b3_logo.svg" />
        Connect
      </h2>
    </div>
  );
}

export function LoginStep({ onSuccess, onError, partnerId, chain }: LoginStepProps) {
  const wallet = ecosystemWallet(ecosystemWalletId, {
    partnerId: partnerId,
  });

  const { theme } = useB3();
  const setIsAuthenticating = useAuthStore(state => state.setIsAuthenticating);
  const setIsAuthenticated = useAuthStore(state => state.setIsAuthenticated);
  const { logout } = useAuthentication(partnerId);

  return (
    <LoginStepContainer partnerId={partnerId}>
      <ConnectEmbed
        showThirdwebBranding={false}
        client={client}
        chain={chain}
        wallets={[wallet]}
        theme={
          theme === "light"
            ? lightTheme({
                colors: {
                  modalBg: "hsl(var(--b3-react-background))",
                },
              })
            : darkTheme({
                colors: {
                  modalBg: "hsl(var(--b3-react-background))",
                },
              })
        }
        autoConnect
        style={{
          width: "100%",
          height: "100%",
          border: 0,
        }}
        // TODO: Integrate with SIWE in useSIWE
        // auth={{
        //   isLoggedIn: async (address) => {
        //     console.log("checking if logged in!", { address });
        //     return await isLoggedIn();
        //   },
        //   doLogin: async (params) => {
        //     console.log("logging in!");
        //     await login(params);
        //   },
        //   getLoginPayload: async ({ address }) =>
        //     generatePayload({ address }),
        //   doLogout: async () => {
        //     console.log("logging out!");
        //     await logout();
        //   },
        // }}
        header={{
          title: "Sign in with B3",
          titleIcon: "https://cdn.b3.fun/b3_logo.svg",
        }}
        onConnect={async wallet => {
          try {
            setIsAuthenticating(true);

            const account = wallet.getAccount();
            if (!account) throw new Error("No account found");

            await onSuccess(account);
            setIsAuthenticated(true);

            console.log("connected!", wallet.id);
          } catch (error) {
            await onError?.(error as Error);
            await logout();
            setIsAuthenticated(false);
          } finally {
            setIsAuthenticating(false);
          }
        }}
      />
    </LoginStepContainer>
  );
}
