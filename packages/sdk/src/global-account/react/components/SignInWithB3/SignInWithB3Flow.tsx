import {
  Loading,
  SignInWithB3ModalProps,
  useB3,
  useGetAllTWSigners,
  useModalStore,
  useSiwe,
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
  loginWithSiwe = false,
  source = "signInWithB3Button",
  signersEnabled = false,
}: SignInWithB3ModalProps) {
  const { setUser, automaticallySetFirstEoa } = useB3();
  const [step, setStep] = useState<"login" | "permissions" | null>(source === "requestPermissions" ? null : "login");
  const [sessionKeyAdded, setSessionKeyAdded] = useState(source === "requestPermissions" ? true : false);
  const { setB3ModalContentType, setB3ModalOpen } = useModalStore();
  const account = useActiveAccount();
  const [loginComplete, setLoginComplete] = useState(source === "requestPermissions" ? true : false);
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
  const { authenticate } = useSiwe();
  const [authenticatingWithB3, setAuthenticatingWithB3] = useState(false);
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
      loginComplete,
      isFetchingSigners,
      source,
    });

    if (loginComplete && !isFetchingSigners) {
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
    loginComplete,
    handleRefetchSigners,
    source,
    closeAfterLogin,
    setB3ModalContentType,
    chain,
    onSessionKeySuccess,
    setB3ModalOpen,
    signersEnabled,
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
      loginWithSiwe,
      source: "requestPermissions",
    });
  }, [
    chain,
    closeAfterLogin,
    loginWithSiwe,
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
      debug("Authenticating with B3 via SIWE");
      if (loginWithSiwe) {
        setAuthenticatingWithB3(true);
        const userAuth = await authenticate(account, partnerId);
        setUser(userAuth.user);
      }
      debug("handleLoginSuccess:account", account);
      onLoginSuccess?.(account);
      setLoginComplete(true);
      setAuthenticatingWithB3(false);
    },
    [authenticate, loginWithSiwe, onLoginSuccess, setUser, partnerId],
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

  if (authenticatingWithB3 || (isFetchingSigners && step === "login") || source === "requestPermissions") {
    return (
      <LoginStepContainer partnerId={partnerId}>
        <div className="mt-8 flex items-center justify-center">
          <Loading variant="white" size="lg" />
        </div>
      </LoginStepContainer>
    );
  }

  if (step === "login") {
    // Custom strategy
    if (strategies?.[0] === "privy") {
      return <SignInWithB3Privy onSuccess={handleLoginSuccess} partnerId={partnerId} chain={chain} />;
    }

    // Strategies are explicitly provided
    if (strategies) {
      return (
        <LoginStepCustom
          strategies={strategies}
          partnerId={partnerId}
          chain={chain}
          onSuccess={handleLoginSuccess}
          onError={onError}
          automaticallySetFirstEoa={!!automaticallySetFirstEoa}
        />
      );
    }

    // Default to handle all strategies we support
    return <LoginStep partnerId={partnerId} chain={chain} onSuccess={handleLoginSuccess} onError={onError} />;
  }

  return null;
}
