import { motion } from "framer-motion";
import { Wallet, ArrowRightLeft, Coins, Zap } from "lucide-react";

const features = [
  {
    icon: <Wallet className="text-b3-blue h-8 w-8" />,
    title: "Seamless Authentication",
    description: "Let users sign in with email, social accounts, or existing wallets - all powered by Global Accounts.",
  },
  {
    icon: <ArrowRightLeft className="text-b3-blue h-8 w-8" />,
    title: "Built-in Onramp",
    description: "Users can buy crypto directly through their Global Account with our integrated fiat onramp.",
  },
  {
    icon: <Coins className="text-b3-blue h-8 w-8" />,
    title: "Universal Identity",
    description: "One Global Account works everywhere - users can access any B3-powered app instantly.",
  },
  {
    icon: <Zap className="text-b3-blue h-8 w-8" />,
    title: "Gasless Experience",
    description: "Global Accounts handle gas fees behind the scenes for a truly seamless user experience.",
  },
];

export function Features() {
  return (
    <section className="py-24">
      <div className="container relative">
        <div className="absolute inset-0 -mx-4 rounded-3xl bg-white/70 backdrop-blur-md" />
        <div className="relative">
          <motion.h2
            className="font-calibre mb-16 text-center text-4xl font-bold md:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            The Power of Global Accounts
          </motion.h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="rounded-2xl bg-gray-50 p-6 transition-colors hover:bg-gray-100"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="font-calibre mb-2 text-xl font-bold">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
