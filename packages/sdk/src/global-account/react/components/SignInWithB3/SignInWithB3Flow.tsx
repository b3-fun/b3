import {
  Loading,
  SignInWithB3ModalProps,
  useAuthentication,
  useAuthStore,
  useB3Config,
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
  const { automaticallySetFirstEoa, enableTurnkey } = useB3Config();
  const { user, refetchUser } = useAuthentication(partnerId);

  const [step, setStep] = useState<"login" | "permissions" | null>(source === "requestPermissions" ? null : "login");
  const [sessionKeyAdded, setSessionKeyAdded] = useState(source === "requestPermissions" ? true : false);
  const { setB3ModalContentType, setB3ModalOpen, isOpen, contentType } = useModalStore();
  const account = useActiveAccount();
  const isAuthenticating = useAuthStore(state => state.isAuthenticating);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isConnected = useAuthStore(state => state.isConnected);
  const setJustCompletedLogin = useAuthStore(state => state.setJustCompletedLogin);
  const [refetchCount, setRefetchCount] = useState(0);
  const [refetchError, setRefetchError] = useState<string | null>(null);
  const [turnkeyAuthCompleted, setTurnkeyAuthCompleted] = useState(false);
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

  // Extract the completion flow logic to be reused
  const handlePostTurnkeyFlow = useCallback(() => {
    debug("Running post-Turnkey flow logic");

    // Check if we already have a signer for this partner
    const hasExistingSigner = signers?.some(signer => signer.partner.id === partnerId);

    if (hasExistingSigner) {
      // Path 1: User already has a signer for this partner
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
    } else if (signersEnabled) {
      // Path 2: No existing signer, but signers are enabled
      if (source !== "requestPermissions") {
        // Navigate to permissions step to request new signer
        setStep("permissions");
      } else {
        // Already in request permissions flow, retry fetching signers
        handleRefetchSigners();
      }
    } else {
      // Path 3: No existing signer and signers are not enabled
      // Default handling for when no signer exists and signers are not enabled
      if (closeAfterLogin) {
        setB3ModalOpen(false);
      } else {
        // if not closed, default to manage account
        setB3ModalContentType({
          type: "manageAccount",
          chain,
          partnerId,
        });
      }
    }
  }, [
    signers,
    partnerId,
    onSessionKeySuccess,
    closeAfterLogin,
    setB3ModalOpen,
    setB3ModalContentType,
    chain,
    source,
    signersEnabled,
    handleRefetchSigners,
    setSessionKeyAdded,
  ]);

  // Define handleTurnkeySuccess before the useEffect that uses it
  const handleTurnkeySuccess = useCallback(
    async (user: any) => {
      debug("Turnkey authentication successful - setting completed flag", { user });

      // Set completed flag FIRST before any async operations
      setTurnkeyAuthCompleted(true);

      // Refetch user to update the user state with Turnkey ID
      debug("Refetching user after Turnkey success...");
      await refetchUser();
      debug("User refetched successfully");

      // After user data is refreshed, close Turnkey modal and go back to sign-in flow
      debug("Switching back to signInWithB3 modal");
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
        source,
        signersEnabled,
      });
      // The useEffect will re-run with updated user data to complete the sign-in process
    },
    [
      refetchUser,
      setB3ModalContentType,
      strategies,
      onLoginSuccess,
      onSessionKeySuccess,
      onError,
      chain,
      sessionKeyAddress,
      partnerId,
      closeAfterLogin,
      source,
      signersEnabled,
    ],
  );

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

    if (isConnected && isAuthenticated && user) {
      // Mark that login just completed BEFORE opening manage account or closing modal
      // This allows Turnkey modal to show (if enableTurnkey is true)
      if (closeAfterLogin) {
        setJustCompletedLogin(true);
      }

      // Check if we should show Turnkey login form
      // Show if enableTurnkey is true AND user just logged in AND hasn't completed Turnkey auth in this session
      // For new users (!turnkeyId): Show email form
      // For returning users (turnkeyId && turnkeyEmail): Auto-skip to OTP
      // Also check that we're not already showing the Turnkey modal
      const hasTurnkeyId = user?.partnerIds?.turnkeyId;
      const hasTurnkeyEmail = !!user?.email;
      const isTurnkeyModalCurrentlyOpen = contentType?.type === "turnkeyAuth";
      const shouldShowTurnkeyModal =
        enableTurnkey &&
        user &&
        !turnkeyAuthCompleted &&
        !isTurnkeyModalCurrentlyOpen &&
        (!hasTurnkeyId || (hasTurnkeyId && hasTurnkeyEmail));

      if (shouldShowTurnkeyModal) {
        // Extract email from user object - check partnerIds.turnkeyEmail first, then twProfiles, then user.email
        const email = user?.email || user?.twProfiles?.find((profile: any) => profile.details?.email)?.details?.email;

        // Open Turnkey modal through the modal store
        setB3ModalContentType({
          type: "turnkeyAuth",
          onSuccess: handleTurnkeySuccess,
          onClose: () => {
            // After closing Turnkey modal, continue with the rest of the flow
            setTurnkeyAuthCompleted(true);
            debug("Turnkey modal closed, running post-Turnkey flow");
            handlePostTurnkeyFlow();
          },
          initialEmail: email,
          skipToOtp: !!(hasTurnkeyId && hasTurnkeyEmail),
          closable: false, // Turnkey modal cannot be closed until auth is complete
        });
        return;
      }

      // Normal flow continues after Turnkey auth is complete (or if not needed)
      handlePostTurnkeyFlow();
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
    setJustCompletedLogin,
    user,
    enableTurnkey,
    turnkeyAuthCompleted,
    handleTurnkeySuccess,
    contentType,
    handlePostTurnkeyFlow,
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

  // Render content based on current step/state
  let content = null;

  // Display error if refetch limit exceeded
  if (refetchError) {
    content = (
      <LoginStepContainer partnerId={partnerId}>
        <div className="p-4 text-center text-red-500">{refetchError}</div>
      </LoginStepContainer>
    );
  } else if (isAuthenticating || (isFetchingSigners && step === "login") || source === "requestPermissions") {
    content = (
      <LoginStepContainer partnerId={partnerId}>
        <div className="my-8 flex min-h-[350px] items-center justify-center">
          <Loading variant="white" size="lg" />
        </div>
      </LoginStepContainer>
    );
  } else if (step === "login") {
    // Custom strategy
    if (strategies?.[0] === "privy") {
      content = <SignInWithB3Privy onSuccess={handleLoginSuccess} chain={chain} />;
    } else if (strategies) {
      // Strategies are explicitly provided
      content = (
        <LoginStepCustom
          strategies={strategies}
          chain={chain}
          onSuccess={handleLoginSuccess}
          onError={onError}
          automaticallySetFirstEoa={!!automaticallySetFirstEoa}
        />
      );
    } else {
      // Default to handle all strategies we support
      content = <LoginStep chain={chain} onSuccess={handleLoginSuccess} onError={onError} />;
    }
  }

  return content;
}
