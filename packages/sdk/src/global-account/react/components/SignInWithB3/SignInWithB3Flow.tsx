import {
  Loading,
  SignInWithB3ModalProps,
  useAuthStore,
  useB3,
  useGetAllTWSigners,
  useModalStore,
} from "@b3dotfun/sdk/global-account/react";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useCallback, useEffect, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { Account } from "thirdweb/wallets";
import { SignInWithB3Privy } from "./SignInWithB3Privy";
import { LoginStep, LoginStepContainer } from "./steps/LoginStep";
import { LoginStepCustom } from "./steps/LoginStepCustom";

const debug = debugB3React("SignInWithB3Flow");
const MAX_REFETCH_ATTEMPTS = 20;

/**
 * Component that manages the authentication flow for Sign In With B3
 * Handles different login providers, authentication steps, and session key management
 */
export function SignInWithB3Flow({
  strategies,
  onLoginSuccess,
  onSessionKeySuccess,
  onError,
  chain,
  sessionKeyAddress,
  partnerId,
  closeAfterLogin = false,
  source = "signInWithB3Button",
  signersEnabled = false,
}: SignInWithB3ModalProps) {
  const { automaticallySetFirstEoa } = useB3();
  const [step, setStep] = useState<"login" | "permissions" | null>(source === "requestPermissions" ? null : "login");
  const [sessionKeyAdded, setSessionKeyAdded] = useState(source === "requestPermissions" ? true : false);
  const { setB3ModalContentType, setB3ModalOpen, isOpen } = useModalStore();
  const account = useActiveAccount();
  const isAuthenticating = useAuthStore(state => state.isAuthenticating);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isConnected = useAuthStore(state => state.isConnected);
  const [refetchCount, setRefetchCount] = useState(0);
  const [refetchError, setRefetchError] = useState<string | null>(null);
  const {
    data: signers,
    refetch: refetchSigners,
    isFetching: isFetchingSigners,
  } = useGetAllTWSigners({
    chain,
    accountAddress: account?.address,
    queryOptions: {
      enabled: signersEnabled,
    },
  });
  const [refetchQueued, setRefetchQueued] = useState(false);

  // Enhanced refetchSigners function that tracks number of attempts
  const handleRefetchSigners = useCallback(() => {
    if (refetchQueued) {
      return;
    }

    if (refetchCount >= MAX_REFETCH_ATTEMPTS) {
      setRefetchError(`Failed to fetch signers after ${MAX_REFETCH_ATTEMPTS} attempts`);
      onError?.(new Error(`Failed to fetch signers after ${MAX_REFETCH_ATTEMPTS} attempts`));
      return;
    }

    // Calculate backoff delay (100ms, 200ms, 400ms, 800ms, 1000ms, 1000ms...)
    const backoffDelay = Math.min(Math.pow(2, refetchCount) * 100, 10000);

    debug(`Retrying fetch (attempt ${refetchCount + 1}/${MAX_REFETCH_ATTEMPTS}) with ${backoffDelay}ms delay`);

    // Increment count and schedule refetch with backoff
    setRefetchCount(prev => prev + 1);
    setRefetchQueued(true);
    setTimeout(() => {
      refetchSigners();
      setRefetchQueued(false);
    }, backoffDelay);
  }, [refetchCount, refetchSigners, onError, setRefetchQueued, refetchQueued]);

  // Handle post-login flow after signers are loaded
  useEffect(() => {
    debug("@@SignInWithB3Flow:useEffect", {
      isConnected,
      isAuthenticating,
      isFetchingSigners,
      closeAfterLogin,
      isOpen,
      source,
    });

    if (isConnected && isAuthenticated) {
      // Check if we already have a signer for this partner
      const hasExistingSigner = signers?.some(signer => signer.partner.id === partnerId);
      if (hasExistingSigner) {
        setSessionKeyAdded(true);
        onSessionKeySuccess?.();
        if (closeAfterLogin) {
          setB3ModalOpen(false);
        } else {
          setB3ModalContentType({
            type: "manageAccount",
            chain,
            partnerId,
          });
        }
      } else if (source !== "requestPermissions") {
        if (signersEnabled) setStep("permissions");
      } else {
        if (signersEnabled) handleRefetchSigners();
      }

      // Default handling
      if (closeAfterLogin) {
        setB3ModalOpen(false);
      }

      // if not closed, always default to manage account
      setB3ModalContentType({
        type: "manageAccount",
        chain,
        partnerId,
      });
    }
  }, [
    signers,
    isFetchingSigners,
    partnerId,
    handleRefetchSigners,
    source,
    closeAfterLogin,
    setB3ModalContentType,
    chain,
    onSessionKeySuccess,
    setB3ModalOpen,
    signersEnabled,
    isConnected,
    isAuthenticating,
    isAuthenticated,
    isOpen,
  ]);

  debug("render", {
    step,
    strategies,
    account,
    signers,
    refetchCount,
    refetchError,
  });

  // Keep this effect for handling closeAfterLogin when adding new session keys
  useEffect(() => {
    if (closeAfterLogin && sessionKeyAdded) {
      setB3ModalOpen(false);
    }
  }, [closeAfterLogin, sessionKeyAdded, setB3ModalOpen]);

  const onSessionKeySuccessEnhanced = useCallback(() => {
    onSessionKeySuccess?.();
    setB3ModalContentType({
      type: "signInWithB3",
      strategies,
      onLoginSuccess,
      onSessionKeySuccess,
      onError,
      chain,
      sessionKeyAddress,
      partnerId,
      closeAfterLogin,
      source: "requestPermissions",
    });
  }, [
    chain,
    closeAfterLogin,
    onError,
    onLoginSuccess,
    onSessionKeySuccess,
    partnerId,
    sessionKeyAddress,
    setB3ModalContentType,
    strategies,
  ]);

  const handleLoginSuccess = useCallback(
    async (account: Account) => {
      onLoginSuccess?.(account);
    },
    [onLoginSuccess],
  );

  useEffect(() => {
    if (step === "permissions") {
      setB3ModalContentType({
        type: "requestPermissions",
        chain,
        sessionKeyAddress,
        onSuccess: onSessionKeySuccessEnhanced,
        onError,
      });
    }
  }, [chain, onError, onSessionKeySuccessEnhanced, sessionKeyAddress, setB3ModalContentType, step]);

  // Display error if refetch limit exceeded
  if (refetchError) {
    return (
      <LoginStepContainer partnerId={partnerId}>
        <div className="p-4 text-center text-red-500">{refetchError}</div>
      </LoginStepContainer>
    );
  }

  if (isAuthenticating || (isFetchingSigners && step === "login") || source === "requestPermissions") {
    return (
      <LoginStepContainer partnerId={partnerId}>
        <div className="my-8 flex min-h-[350px] items-center justify-center">
          <Loading variant="white" size="lg" />
        </div>
      </LoginStepContainer>
    );
  }

  if (step === "login") {
    // Custom strategy
    if (strategies?.[0] === "privy") {
      return <SignInWithB3Privy onSuccess={handleLoginSuccess} chain={chain} />;
    }

    // Strategies are explicitly provided
    if (strategies) {
      return (
        <LoginStepCustom
          strategies={strategies}
          chain={chain}
          onSuccess={handleLoginSuccess}
          onError={onError}
          automaticallySetFirstEoa={!!automaticallySetFirstEoa}
        />
      );
    }

    // Default to handle all strategies we support
    return <LoginStep chain={chain} onSuccess={handleLoginSuccess} onError={onError} />;
  }

  return null;
}
