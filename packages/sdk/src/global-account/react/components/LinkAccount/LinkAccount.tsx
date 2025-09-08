import app from "@b3dotfun/sdk/global-account/app";
import { ecosystemWalletId } from "@b3dotfun/sdk/shared/constants";
import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { Loader2, Mail, Phone } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useLinkProfile, useProfiles } from "thirdweb/react";
import { preAuthenticate } from "thirdweb/wallets";
import { LinkAccountModalProps, useModalStore } from "../../stores/useModalStore";
import { getProfileDisplayInfo } from "../../utils/profileDisplay";
import { useB3 } from "../B3Provider/useB3";
import { AppleIcon } from "../icons/AppleIcon";
import { DiscordIcon } from "../icons/DiscordIcon";
import { FarcasterIcon } from "../icons/FarcasterIcon";
import { GoogleIcon } from "../icons/GoogleIcon";
import { XIcon } from "../icons/XIcon";
import { Button } from "../ui/button";
type OTPStrategy = "email" | "phone";
type SocialStrategy = "google" | "x" | "discord" | "apple" | "farcaster";
type Strategy = OTPStrategy | SocialStrategy;

interface AuthMethod {
  id: Strategy;
  label: string;
  enabled: boolean;
  icon: React.ReactNode;
}

const AUTH_METHODS: AuthMethod[] = [
  { id: "email", label: "Email", enabled: true, icon: <Mail className="text-b3-primary-blue size-6" /> },
  { id: "phone", label: "Phone", enabled: true, icon: <Phone className="text-b3-primary-blue size-6" /> },
  { id: "google", label: "Google", enabled: true, icon: <GoogleIcon className="size-6" /> },
  { id: "x", label: "X (Twitter)", enabled: true, icon: <XIcon className="size-6" /> },
  { id: "discord", label: "Discord", enabled: true, icon: <DiscordIcon className="size-6" /> },
  { id: "apple", label: "Apple", enabled: true, icon: <AppleIcon className="size-6" /> },
  {
    id: "farcaster",
    label: "Farcaster",
    enabled: true,
    icon: <FarcasterIcon className="size-6" />,
  },
];

export function LinkAccount({
  onSuccess: onSuccessCallback,
  onError,
  onClose,
  chain,
  partnerId,
  className,
}: LinkAccountModalProps & { className?: string }) {
  const { isLinking, linkingMethod, setLinkingState, navigateBack, setB3ModalContentType } = useModalStore();
  const [selectedMethod, setSelectedMethod] = useState<Strategy | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: profilesRaw = [] } = useProfiles({ client });

  // Get connected auth methods
  const connectedAuthMethods = profilesRaw
    .filter((profile: any) => !["custom_auth_endpoint", "siwe"].includes(profile.type))
    .map((profile: any) => profile.type as Strategy);

  // Filter available auth methods
  const availableAuthMethods = AUTH_METHODS.filter(
    method => !connectedAuthMethods.includes(method.id) && method.enabled,
  );

  const profiles = profilesRaw
    .filter((profile: any) => !["custom_auth_endpoint", "siwe"].includes(profile.type))
    .map((profile: any) => ({
      ...getProfileDisplayInfo(profile),
      originalProfile: profile,
    }));

  const { account } = useB3();
  const { mutate: linkProfile } = useLinkProfile();

  const onSuccess = useCallback(async () => {
    await onSuccessCallback?.();
  }, [onSuccessCallback]);

  // Reset linking state when component unmounts
  useEffect(() => {
    return () => {
      if (isLinking) {
        setLinkingState(false);
      }
    };
  }, [isLinking, setLinkingState]);

  const mutationOptions = {
    onError: (error: Error) => {
      console.error("Error linking account:", error);
      toast.error(error.message);
      setLinkingState(false);
      onError?.(error);
    },
    onSuccess: async (data: any) => {
      console.log("Raw Link Account Data:", data);
      try {
        console.log("Sync user data...");
        await app.service("users").syncTwProfiles({});
      } catch (refreshError) {
        console.warn("⚠️ Could not sync user data:", refreshError);
      }
    },
  };

  const validateInput = () => {
    if (selectedMethod === "email") {
      if (!email) {
        setError("Please enter your email address");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Please enter a valid email address");
        return false;
      }
    } else if (selectedMethod === "phone") {
      if (!phone) {
        setError("Please enter your phone number");
        return false;
      }
      if (!/^\+?[\d\s-]{10,}$/.test(phone)) {
        setError("Please enter a valid phone number");
        return false;
      }
    }
    setError(null);
    return true;
  };

  const handleSendOTP = async () => {
    if (!validateInput()) return;

    try {
      setLinkingState(true, selectedMethod);
      setError(null);

      if (selectedMethod === "email") {
        await preAuthenticate({
          client,
          strategy: "email",
          email,
          ecosystem: {
            id: ecosystemWalletId,
            partnerId: partnerId,
          },
        });
      } else if (selectedMethod === "phone") {
        await preAuthenticate({
          client,
          strategy: "phone",
          phoneNumber: phone,
          ecosystem: {
            id: ecosystemWalletId,
            partnerId: partnerId,
          },
        });
      }

      setOtpSent(true);
    } catch (error) {
      console.error("Error sending OTP:", error);
      setError(error instanceof Error ? error.message : "Failed to send OTP");
      onError?.(error as Error);
      setLinkingState(false);
    }
  };

  const handleLinkAccount = async () => {
    if (!otp) {
      console.error("No OTP entered");
      setError("Please enter the verification code");
      return;
    }

    try {
      setOtpSent(false);
      setLinkingState(true, selectedMethod);
      setError(null);

      if (selectedMethod === "email") {
        await linkProfile(
          {
            client,
            strategy: "email",
            email,
            verificationCode: otp,
          },
          mutationOptions,
        );
      } else if (selectedMethod === "phone") {
        await linkProfile(
          {
            client,
            strategy: "phone",
            phoneNumber: phone,
            verificationCode: otp,
          },
          mutationOptions,
        );
      }
    } catch (error) {
      console.error("Error linking account:", error);
      setError(error instanceof Error ? error.message : "Failed to link account");
      onError?.(error as Error);
    }
  };

  const handleSocialLink = async (strategy: SocialStrategy) => {
    try {
      console.log("handleSocialLink", strategy);
      setLinkingState(true, strategy);
      setError(null);

      const result = await linkProfile(
        {
          client,
          strategy,
        },
        mutationOptions,
      );

      console.log("result", result);

      // Don't close the modal yet, wait for auth to complete
      onSuccess?.();
    } catch (error) {
      console.error("Error linking with social:", error);
      setError(error instanceof Error ? error.message : "Failed to link social account");
      onError?.(error as Error);
      setLinkingState(false);
    }
  };

  // Add effect to handle social auth completion
  useEffect(() => {
    if (isLinking && linkingMethod && !selectedMethod) {
      // This means we're in a social auth flow
      const checkAuthStatus = async () => {
        try {
          // Wait a bit to ensure auth is complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          onClose?.();
        } catch (error) {
          console.error("Error checking auth status:", error);
          setLinkingState(false);
        }
      };

      checkAuthStatus();
    }
  }, [isLinking, linkingMethod, selectedMethod, onClose, setLinkingState]);

  const handleBack = useCallback(() => {
    if (isLinking) return;
    setSelectedMethod(null);
    setEmail("");
    setPhone("");
    setOtp("");
    setOtpSent(false);
    setError(null);
    setLinkingState(false);
  }, [isLinking, setSelectedMethod, setEmail, setPhone, setOtp, setOtpSent, setError, setLinkingState]);

  const handleFinishedLinking = useCallback(
    (success: boolean) => {
      if (success) {
        onSuccess?.();
        onClose?.();
      }

      setLinkingState(false);
      navigateBack();
      setB3ModalContentType({
        type: "manageAccount",
        activeTab: "settings",
        setActiveTab: () => {},
        chain,
        partnerId,
      });
    },
    [chain, navigateBack, partnerId, setB3ModalContentType, setLinkingState, onSuccess, onClose],
  );

  useEffect(() => {
    if (isLinking) {
      handleFinishedLinking(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles.length]);

  if (!account) {
    return <div className="text-b3-foreground-muted py-8 text-center">Please connect your account first</div>;
  }

  return (
    <div className={`b3-link-account space-y-6 p-6 ${className || ""}`} data-testid="link-account">
      <div className="b3-link-account-header flex items-center justify-between">
        <h2 className="b3-link-account-title text-b3-grey font-neue-montreal-semibold text-2xl">Link New Account</h2>
        {selectedMethod && (
          <Button variant="ghost" className="text-b3-grey hover:text-b3-grey/80" onClick={handleBack}>
            Backs
          </Button>
        )}
      </div>

      {!selectedMethod ? (
        <div className="b3-link-account-methods grid gap-3">
          {availableAuthMethods.map(method => (
            <Button
              key={method.id}
              variant="outline"
              className="b3-link-account-method-button border-b3-line hover:border-b3-primary-blue/30 hover:bg-b3-primary-blue/5 text-b3-grey font-neue-montreal-medium h-14 justify-start bg-transparent px-6 text-base transition-all duration-200"
              data-method={method.id}
              onClick={() => {
                if (method.id === "email" || method.id === "phone") {
                  setSelectedMethod(method.id);
                } else {
                  handleSocialLink(method.id as SocialStrategy);
                }
              }}
              disabled={linkingMethod === method.id}
            >
              {isLinking && linkingMethod === method.id ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <div className="b3-link-account-method-content flex items-center gap-4">
                  <div className="b3-link-account-method-icon flex items-center justify-center rounded-full">
                    {method.icon}
                  </div>
                  <span className="b3-link-account-method-label font-medium">{method.label}</span>
                </div>
              )}
            </Button>
          ))}
          {availableAuthMethods.length === 0 && (
            <div className="text-b3-foreground-muted py-8 text-center">
              All available authentication methods have been connected
            </div>
          )}
        </div>
      ) : (
        <div className="b3-link-account-form space-y-4">
          {selectedMethod === "email" && (
            <div className="space-y-2">
              <label className="text-b3-grey font-neue-montreal-medium text-sm">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-b3-line text-b3-grey font-neue-montreal-medium focus:ring-b3-primary-blue/20 w-full rounded-xl p-4 focus:outline-none focus:ring-2"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={otpSent || (isLinking && linkingMethod === "email")}
              />
            </div>
          )}

          {selectedMethod === "phone" && (
            <div className="space-y-2">
              <label className="text-b3-grey font-neue-montreal-medium text-sm">Phone Number</label>
              <input
                type="tel"
                placeholder="Enter your phone number"
                className="bg-b3-line text-b3-grey font-neue-montreal-medium focus:ring-b3-primary-blue/20 w-full rounded-xl p-4 focus:outline-none focus:ring-2"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                disabled={otpSent || (isLinking && linkingMethod === "phone")}
              />
              <p className="text-b3-foreground-muted font-neue-montreal-medium text-sm">
                Include country code (e.g., +1 for US)
              </p>
            </div>
          )}

          {error && <div className="text-b3-negative font-neue-montreal-medium py-2 text-sm">{error}</div>}

          {otpSent ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-b3-grey font-neue-montreal-medium text-sm">Verification Code</label>
                <input
                  type="text"
                  placeholder="Enter verification code"
                  className="bg-b3-line text-b3-grey font-neue-montreal-medium focus:ring-b3-primary-blue/20 w-full rounded-xl p-4 focus:outline-none focus:ring-2"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                />
              </div>
              <Button
                className="bg-b3-primary-blue hover:bg-b3-primary-blue/90 font-neue-montreal-semibold h-12 w-full text-white"
                onClick={handleLinkAccount}
              >
                Link Account
              </Button>
            </div>
          ) : (
            <Button
              className="bg-b3-primary-blue hover:bg-b3-primary-blue/90 font-neue-montreal-semibold h-12 w-full text-white"
              onClick={handleSendOTP}
              disabled={(!email && !phone) || (isLinking && linkingMethod === selectedMethod)}
            >
              {isLinking && linkingMethod === selectedMethod ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Send Verification Code"
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
