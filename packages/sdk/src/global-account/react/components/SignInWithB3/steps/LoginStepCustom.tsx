import {
  AllowedStrategy,
  AuthButton,
  Button,
  getConnectOptionsFromStrategy,
  isWalletType,
  LoginStepContainer,
  useAuthentication,
  useAuthStore,
  useConnect,
  WalletRow,
} from "@b3dotfun/sdk/global-account/react";
import { debug } from "@b3dotfun/sdk/shared/utils/debug";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { useState } from "react";
import { Chain } from "thirdweb";
import { useConnect as useConnectTW } from "thirdweb/react";
import { Account, createWallet, Wallet, WalletId } from "thirdweb/wallets";

interface LoginStepCustomProps {
  automaticallySetFirstEoa: boolean;
  onSuccess: (account: Account) => Promise<void>;
  onError?: (error: Error) => Promise<void>;
  partnerId: string;
  chain: Chain;
  strategies: AllowedStrategy[];
  maxInitialWallets?: number;
}

export function LoginStepCustom({
  onSuccess,
  onError,
  partnerId,
  chain,
  strategies,
  maxInitialWallets = 2,
  automaticallySetFirstEoa,
}: LoginStepCustomProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showAllWallets, setShowAllWallets] = useState(false);
  const { connect } = useConnect(partnerId, chain);
  const setIsAuthenticating = useAuthStore(state => state.setIsAuthenticating);
  const setIsAuthenticated = useAuthStore(state => state.setIsAuthenticated);
  const { logout } = useAuthentication(partnerId);
  const { connect: connectTW } = useConnectTW();

  // Split strategies into auth and wallet types
  const authStrategies = strategies.filter(s => !isWalletType(s));
  const walletStrategies = strategies.filter(isWalletType);
  const initialWallets = walletStrategies.slice(0, maxInitialWallets);
  const additionalWallets = walletStrategies.slice(maxInitialWallets);

  const handleConnect = async (strategy: AllowedStrategy) => {
    try {
      setIsLoading(true);
      debug("setIsAuthenticating:true:3");
      setIsAuthenticating(true);
      const options = getConnectOptionsFromStrategy(strategy);
      let connectResult: Wallet | null;

      if (automaticallySetFirstEoa) {
        if (!options.wallet?.id) {
          throw new Error("Wallet ID is required");
        }
        connectResult = await connectTW(async () => {
          const wallet = createWallet(options.wallet?.id as WalletId);
          await wallet.connect({
            client,
          });

          return wallet;
        });
      } else {
        // @ts-expect-error we have custom strategies too and we also get things like "apple" isn't assignable to "wallet"
        connectResult = await connect(options);
      }

      const account = connectResult?.getAccount();
      console.log("@@gio:connectResult", { connectResult, account, options });
      if (!account) throw new Error("Failed to connect");
      await onSuccess(account);
      setIsAuthenticated(true);
    } catch (error) {
      await onError?.(error as Error);
      await logout();
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      debug("setIsAuthenticating:false:3");
      setIsAuthenticating(false);
    }
  };

  return (
    <LoginStepContainer partnerId={partnerId}>
      {/* Auth Strategies */}
      {authStrategies.length > 0 && (
        <div className="mb-6 grid w-full grid-cols-4 gap-4">
          {authStrategies.map(strategy => {
            console.log("strategy", strategy);
            return (
              <AuthButton
                key={strategy}
                strategy={strategy}
                onClick={() => handleConnect(strategy)}
                isLoading={isLoading}
              />
            );
          })}
        </div>
      )}

      {/* Initial Wallet List */}
      <div className="mb-4 w-full space-y-2">
        {initialWallets.map(walletId => (
          <WalletRow
            key={walletId}
            walletId={walletId as WalletId}
            onClick={() => handleConnect(walletId)}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* Additional Wallets Section */}
      {additionalWallets.length > 0 && (
        <div className="w-full">
          <Button
            onClick={() => setShowAllWallets(!showAllWallets)}
            className="mb-2 w-full bg-transparent text-gray-600 hover:bg-gray-100"
          >
            {showAllWallets ? "Show less" : "More options"}
          </Button>

          {showAllWallets && (
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {additionalWallets.map(walletId => (
                <WalletRow
                  key={walletId}
                  walletId={walletId as WalletId}
                  onClick={() => handleConnect(walletId)}
                  isLoading={isLoading}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </LoginStepContainer>
  );
}
