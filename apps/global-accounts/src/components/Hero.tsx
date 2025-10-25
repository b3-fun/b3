import { motion } from "framer-motion";
import { CreditCard, Shield, UserCircle, Wallet as WalletIcon } from "lucide-react";
import type { Wallet } from "../utils/wallet";
import { SignIn } from "./SignIn";
import { Background } from "./ui/Background";

const features = [
  {
    icon: <UserCircle className="h-6 w-6" />,
    text: "Email, Social & Wallet Login",
  },
  {
    icon: <CreditCard className="h-6 w-6" />,
    text: "Built-in Fiat Onramp",
  },
  {
    icon: <Shield className="h-6 w-6" />,
    text: "Gasless Transactions",
  },
  {
    icon: <WalletIcon className="h-6 w-6" />,
    text: "Smart Account Infrastructure",
  },
];

export function Hero({ wallet }: { wallet: Wallet }) {
  return (
    <>
      <Background />
      <section className="relative flex min-h-[90vh] items-center justify-center">
        <div className="container mx-auto px-4 pb-16 pt-20 text-center">
          <img src="https://cdn.b3.fun/b3_logo@.png" alt="B3 Logo" className="mx-auto mb-8 h-20" />
          <h1 className="font-neue-montreal mb-6 text-6xl font-black tracking-tight md:text-8xl">
            One Identity with Global Accounts
          </h1>
          <p className="text-b3-grey mx-auto mb-12 max-w-3xl text-2xl md:text-3xl">
            The powerful authentication solution for Web3 apps.
          </p>

          <div className="b3-sign-in-button mb-16 flex justify-center font-bold">
            <SignIn wallet={wallet} />
          </div>

          <div className="mx-auto mb-24 grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                className="flex flex-col items-center gap-3 rounded-xl border border-gray-100 bg-white/50 p-6 backdrop-blur-sm"
              >
                <div className="bg-b3-blue/10 text-b3-blue rounded-full p-3">{feature.icon}</div>
                <p className="font-neue-montreal-medium text-lg text-gray-600">{feature.text}</p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="rounded-2xl border border-gray-100 bg-white/70 p-10 backdrop-blur-sm"
          >
            <h3 className="font-neue-montreal-medium mb-6 text-2xl">Try it out:</h3>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-5">
                <p className="font-neue-montreal text-lg text-gray-600">1. Click "Sign in with B3" above</p>
                <p className="font-neue-montreal text-lg text-gray-600">2. Choose email, social, or wallet login</p>
                <p className="font-neue-montreal text-lg text-gray-600">3. Get a smart account automatically</p>
              </div>
              <div className="space-y-5">
                <p className="font-neue-montreal text-lg text-gray-600">✓ No wallet download needed</p>
                <p className="font-neue-montreal text-lg text-gray-600">✓ Instant access to Web3</p>
                <p className="font-neue-montreal text-lg text-gray-600">✓ Works across all B3 apps</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
