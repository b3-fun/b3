import { useAuthentication, useB3, useQueryB3 } from "@b3dotfun/sdk/global-account/react";
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
    <div className="flex flex-col items-center justify-center pt-6">
      {partnerLogo && (
        <img src={partnerLogo} alt="Partner Logo" className="partner-logo mb-6 h-12 w-auto object-contain" />
      )}
      {children}
    </div>
  );
}

export function LoginStep({ onSuccess, chain }: LoginStepProps) {
  const { partnerId, theme } = useB3();
  const wallet = ecosystemWallet(ecosystemWalletId, {
    partnerId: partnerId,
  });
  const { onConnect } = useAuthentication(partnerId);

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
        style={{
          width: "100%",
          height: "100%",
          border: 0,
        }}
        header={{
          title: "Sign in with B3",
          titleIcon: "https://cdn.b3.fun/b3_logo.svg",
        }}
        className="b3-login-step"
        onConnect={async wallet => {
          await onConnect(wallet, []);
          const account = wallet.getAccount();
          if (!account) throw new Error("No account found");
          await onSuccess(account);
        }}
      />
    </LoginStepContainer>
  );
}
