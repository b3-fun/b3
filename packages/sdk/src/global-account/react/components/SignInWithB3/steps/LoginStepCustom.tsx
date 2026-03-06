import {
  AllowedStrategy,
  AuthButton,
  Button,
  getConnectOptionsFromStrategy,
  Input,
  isWalletType,
  LoginStepContainer,
  useAuthentication,
  useAuthStore,
  useB3Config,
  useConnect,
  WalletRow,
} from "@b3dotfun/sdk/global-account/react";
import { ecosystemWalletId } from "@b3dotfun/sdk/shared/constants";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { useState } from "react";
import { Chain } from "thirdweb";
import { useConnectedWallets, useConnect as useConnectTW } from "thirdweb/react";
import {
  Account,
  createWallet,
  MultiStepAuthArgsType,
  preAuthenticate,
  SingleStepAuthArgsType,
  Wallet,
  WalletId,
} from "thirdweb/wallets";

interface LoginStepCustomProps {
  automaticallySetFirstEoa: boolean;
  onSuccess: (account: Account) => Promise<void>;
  onError?: (error: Error) => Promise<void>;
  chain: Chain;
  strategies: AllowedStrategy[];
  maxInitialWallets?: number;
}

const debug = debugB3React("LoginStepCustom");
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginStepCustom({
  onSuccess,
  onError,
  chain,
  strategies,
  maxInitialWallets = 2,
  automaticallySetFirstEoa,
}: LoginStepCustomProps) {
  const { partnerId } = useB3Config();
  const [isLoading, setIsLoading] = useState(false);
  const [showAllWallets, setShowAllWallets] = useState(false);
  const [showEmailFlow, setShowEmailFlow] = useState(false);
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const { connect } = useConnect(partnerId, chain);
  const setIsAuthenticating = useAuthStore(state => state.setIsAuthenticating);
  const { connect: onAuthConnect, logout } = useAuthentication(partnerId, { skipAutoConnect: true });
  const { connect: connectTW } = useConnectTW();
  const connectedWallets = useConnectedWallets();

  // Split strategies into auth and wallet types
  const authStrategies = strategies.filter(s => !isWalletType(s));
  const walletStrategies = strategies.filter(isWalletType);
  const initialWallets = walletStrategies.slice(0, maxInitialWallets);
  const additionalWallets = walletStrategies.slice(maxInitialWallets);
  const authGridColumns = Math.max(1, Math.min(authStrategies.length, 4));

  const resetEmailFlow = () => {
    setShowEmailFlow(false);
    setEmailCodeSent(false);
    setVerificationCode("");
    setEmailError(null);
  };

  const connectWithOptions = async (
    strategy: AllowedStrategy,
    options: MultiStepAuthArgsType | SingleStepAuthArgsType,
  ) => {
    try {
      setIsLoading(true);
      debug("setIsAuthenticating:true:3");
      setIsAuthenticating(true);
      let connectResult: Wallet | null;

      if (automaticallySetFirstEoa && isWalletType(strategy) && options.strategy === "wallet") {
        const walletId = options.wallet?.id as WalletId | undefined;
        if (!walletId) {
          throw new Error("Wallet ID is required");
        }

        connectResult = await connectTW(async () => {
          const wallet = createWallet(walletId);
          await wallet.connect({
            client,
          });

          return wallet;
        });
      } else {
        connectResult = await connect(options);
      }

      const account = connectResult?.getAccount();
      debug("@@connectResult", { connectResult, account, options });
      if (!account || !connectResult) throw new Error("Failed to connect");
      const allConnectedWallets =
        connectedWallets.length > 0 && connectedWallets.some(wallet => wallet.id === connectResult.id)
          ? connectedWallets
          : [connectResult, ...connectedWallets.filter(wallet => wallet.id !== connectResult.id)];
      await onAuthConnect(connectResult, allConnectedWallets);
      await onSuccess(account);
      if (strategy === "email") {
        resetEmailFlow();
      }
    } catch (error) {
      if (strategy === "email") {
        setEmailError(error instanceof Error ? error.message : "Failed to sign in with email");
      }
      await onError?.(error as Error);
      await logout();
    } finally {
      setIsLoading(false);
      debug("setIsAuthenticating:false:3");
      setIsAuthenticating(false);
    }
  };

  const handleConnect = async (strategy: AllowedStrategy) => {
    if (strategy === "email") {
      setShowEmailFlow(true);
      setEmailCodeSent(false);
      setVerificationCode("");
      setEmailError(null);
      return;
    }

    const options = getConnectOptionsFromStrategy(strategy);
    await connectWithOptions(strategy, options as SingleStepAuthArgsType);
  };

  const handleSendEmailCode = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setEmailError("Please enter your email address");
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);
      setEmailError(null);
      await preAuthenticate({
        client,
        strategy: "email",
        email: normalizedEmail,
        ecosystem: {
          id: ecosystemWalletId,
          partnerId,
        },
      });
      setEmail(normalizedEmail);
      setEmailCodeSent(true);
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : "Failed to send verification code");
      await onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = verificationCode.trim();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (!normalizedCode) {
      setEmailError("Please enter your verification code");
      return;
    }

    await connectWithOptions("email", {
      strategy: "email",
      email: normalizedEmail,
      verificationCode: normalizedCode,
    });
  };

  return (
    <LoginStepContainer partnerId={partnerId}>
      {showEmailFlow ? (
        <div className="mb-6 w-full space-y-3 px-3">
          <p className="text-center text-sm font-medium text-gray-900 dark:text-gray-100">Sign in with email</p>
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={event => setEmail(event.target.value)}
            disabled={isLoading || emailCodeSent}
          />

          {emailCodeSent && (
            <Input
              type="text"
              placeholder="Enter verification code"
              value={verificationCode}
              onChange={event => setVerificationCode(event.target.value)}
              disabled={isLoading}
            />
          )}

          {emailError && <p className="text-sm text-red-500">{emailError}</p>}

          <Button
            onClick={emailCodeSent ? handleEmailLogin : handleSendEmailCode}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? "Loading..." : emailCodeSent ? "Verify code" : "Send code"}
          </Button>

          {emailCodeSent && (
            <Button variant="outline" onClick={handleSendEmailCode} disabled={isLoading} className="w-full">
              Resend code
            </Button>
          )}

          <Button variant="outline" onClick={resetEmailFlow} disabled={isLoading} className="w-full">
            Back
          </Button>
        </div>
      ) : (
        <>
          {/* Auth Strategies */}
          {authStrategies.length > 0 && (
            <div
              className={`mb-6 grid w-full gap-4 px-3 ${authStrategies.length > 4 ? "grid-cols-4" : ""}`}
              style={authStrategies.length <= 4 ? { gridTemplateColumns: `repeat(${authGridColumns}, minmax(0, 1fr))` } : undefined}
            >
              {authStrategies.map(strategy => (
                <AuthButton
                  key={strategy}
                  strategy={strategy}
                  onClick={() => handleConnect(strategy)}
                  isLoading={isLoading}
                />
              ))}
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
        </>
      )}
    </LoginStepContainer>
  );
}
