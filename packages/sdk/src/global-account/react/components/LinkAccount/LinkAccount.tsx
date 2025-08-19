import { client } from "@b3dotfun/sdk/shared/utils/thirdweb";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useLinkProfile } from "thirdweb/react";
import { preAuthenticate } from "thirdweb/wallets";
import { LinkAccountModalProps } from "../../stores/useModalStore";
import { useB3 } from "../B3Provider/useB3";
import { Button } from "../ui/button";

type OTPStrategy = "email" | "phone";
type SocialStrategy = "google" | "discord" | "apple";
type Strategy = OTPStrategy | SocialStrategy;

const AUTH_METHODS: { id: Strategy; label: string; enabled: boolean }[] = [
  { id: "email", label: "Email", enabled: true },
  { id: "phone", label: "Phone", enabled: true },
  { id: "google", label: "Google", enabled: true },
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

  const { account } = useB3();
  const { mutate: linkProfile } = useLinkProfile();

  const handleSendOTP = async () => {
    try {
      setIsLinking(true);

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
      onError?.(error as Error);
    } finally {
      setIsLinking(false);
    }
  };

  const handleLinkAccount = async () => {
    try {
      setIsLinking(true);

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
      onError?.(error as Error);
    } finally {
      setIsLinking(false);
    }
  };

  const handleSocialLink = async (strategy: SocialStrategy) => {
    try {
      setIsLinking(true);
      await linkProfile({
        client,
        strategy,
      });
      onSuccess?.();
    } catch (error) {
      console.error("Error linking with social:", error);
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
  };

  if (!account) {
    return <div className="text-b3-foreground-muted py-8 text-center">Please connect your account first</div>;
  }

  return (
    <div className="space-y-6 p-4">
      <h2 className="text-b3-grey font-neue-montreal-semibold text-2xl">Link New Account</h2>

      {!selectedMethod ? (
        <div className="grid gap-4">
          {AUTH_METHODS.filter(method => method.enabled).map(method => (
            <Button
              key={method.id}
              className="bg-b3-primary-wash hover:bg-b3-primary-wash/70 text-b3-grey font-neue-montreal-semibold h-16 justify-start text-lg"
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
            <input
              type="email"
              placeholder="Enter your email"
              className="bg-b3-line text-b3-grey w-full rounded-xl p-4"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={otpSent}
            />
          )}

          {selectedMethod === "phone" && (
            <input
              type="tel"
              placeholder="Enter your phone number"
              className="bg-b3-line text-b3-grey w-full rounded-xl p-4"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              disabled={otpSent}
            />
          )}

          {otpSent ? (
            <>
              <input
                type="text"
                placeholder="Enter OTP"
                className="bg-b3-line text-b3-grey w-full rounded-xl p-4"
                value={otp}
                onChange={e => setOtp(e.target.value)}
              />
              <Button
                className="bg-b3-primary-blue hover:bg-b3-primary-blue/90 w-full text-white"
                onClick={handleLinkAccount}
                disabled={isLinking || !otp}
              >
                {isLinking ? <Loader2 className="animate-spin" /> : "Link Account"}
              </Button>
            </>
          ) : (
            <Button
              className="bg-b3-primary-blue hover:bg-b3-primary-blue/90 w-full text-white"
              onClick={handleSendOTP}
              disabled={isLinking || (!email && !phone)}
            >
              {isLinking ? <Loader2 className="animate-spin" /> : "Send OTP"}
            </Button>
          )}

          <Button variant="ghost" className="text-b3-grey w-full" onClick={handleBack}>
            Back
          </Button>
        </div>
      )}
    </div>
  );
}
