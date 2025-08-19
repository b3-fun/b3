import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useLinkProfile } from "thirdweb/react";
import { preAuthenticate } from "thirdweb/wallets";
import { LinkAccountModalProps } from "../../stores/useModalStore";
import { useB3 } from "../B3Provider/useB3";
import { Button } from "../ui/button";

type OTPStrategy = "email" | "phone";
type SocialStrategy = "google" | "x" | "discord" | "apple";
type Strategy = OTPStrategy | SocialStrategy;

interface AuthMethod {
  id: Strategy;
  label: string;
  enabled: boolean;
  icon?: string;
}

const AUTH_METHODS: AuthMethod[] = [
  { id: "email", label: "Email", enabled: true },
  { id: "phone", label: "Phone", enabled: true },
  { id: "google", label: "Google", enabled: true },
  { id: "x", label: "X (Twitter)", enabled: true },
  { id: "discord", label: "Discord", enabled: true },
  { id: "apple", label: "Apple", enabled: true },
];

export function LinkAccount({ onSuccess, onError }: LinkAccountModalProps) {
  const [isLinking, setIsLinking] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<Strategy | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { account } = useB3();
  const { mutate: linkProfile } = useLinkProfile();

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
      setIsLinking(true);
      setError(null);

      if (selectedMethod === "email") {
        await preAuthenticate({
          client,
          strategy: "email",
          email,
        });
      } else if (selectedMethod === "phone") {
        await preAuthenticate({
          client,
          strategy: "phone",
          phoneNumber: phone,
        });
      }

      setOtpSent(true);
    } catch (error) {
      console.error("Error sending OTP:", error);
      setError(error instanceof Error ? error.message : "Failed to send OTP");
      onError?.(error as Error);
    } finally {
      setIsLinking(false);
    }
  };

  const handleLinkAccount = async () => {
    if (!otp) {
      setError("Please enter the verification code");
      return;
    }

    try {
      setIsLinking(true);
      setError(null);

      if (selectedMethod === "email") {
        await linkProfile({
          client,
          strategy: "email",
          email,
          verificationCode: otp,
        });
      } else if (selectedMethod === "phone") {
        await linkProfile({
          client,
          strategy: "phone",
          phoneNumber: phone,
          verificationCode: otp,
        });
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error linking account:", error);
      setError(error instanceof Error ? error.message : "Failed to link account");
      onError?.(error as Error);
    } finally {
      setIsLinking(false);
    }
  };

  const handleSocialLink = async (strategy: SocialStrategy) => {
    try {
      setIsLinking(true);
      setError(null);

      await linkProfile({
        client,
        strategy,
      });

      onSuccess?.();
    } catch (error) {
      console.error("Error linking with social:", error);
      setError(error instanceof Error ? error.message : "Failed to link social account");
      onError?.(error as Error);
    } finally {
      setIsLinking(false);
    }
  };

  const handleBack = () => {
    setSelectedMethod(null);
    setEmail("");
    setPhone("");
    setOtp("");
    setOtpSent(false);
    setError(null);
  };

  if (!account) {
    return <div className="text-b3-foreground-muted py-8 text-center">Please connect your account first</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-b3-grey font-neue-montreal-semibold text-2xl">Link New Account</h2>
        {selectedMethod && (
          <Button variant="ghost" className="text-b3-grey hover:text-b3-grey/80" onClick={handleBack}>
            Back
          </Button>
        )}
      </div>

      {!selectedMethod ? (
        <div className="grid gap-3">
          {AUTH_METHODS.filter(method => method.enabled).map(method => (
            <Button
              key={method.id}
              className="bg-b3-primary-wash hover:bg-b3-primary-wash/70 text-b3-grey font-neue-montreal-semibold h-16 justify-start px-6 text-lg"
              onClick={() => {
                if (method.id === "email" || method.id === "phone") {
                  setSelectedMethod(method.id);
                } else {
                  handleSocialLink(method.id as SocialStrategy);
                }
              }}
              disabled={isLinking}
            >
              {isLinking ? <Loader2 className="animate-spin" /> : method.label}
            </Button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {selectedMethod === "email" && (
            <div className="space-y-2">
              <label className="text-b3-grey font-neue-montreal-medium text-sm">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                className="bg-b3-line text-b3-grey font-neue-montreal-medium focus:ring-b3-primary-blue/20 w-full rounded-xl p-4 focus:outline-none focus:ring-2"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={otpSent || isLinking}
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
                disabled={otpSent || isLinking}
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
                  disabled={isLinking}
                />
              </div>
              <Button
                className="bg-b3-primary-blue hover:bg-b3-primary-blue/90 font-neue-montreal-semibold h-12 w-full text-white"
                onClick={handleLinkAccount}
                disabled={isLinking || !otp}
              >
                {isLinking ? <Loader2 className="animate-spin" /> : "Link Account"}
              </Button>
            </div>
          ) : (
            <Button
              className="bg-b3-primary-blue hover:bg-b3-primary-blue/90 font-neue-montreal-semibold h-12 w-full text-white"
              onClick={handleSendOTP}
              disabled={isLinking || (!email && !phone)}
            >
              {isLinking ? <Loader2 className="animate-spin" /> : "Send Verification Code"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
