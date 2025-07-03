import { motion } from "framer-motion";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-sm">
        <nav className="container mx-auto flex h-16 items-center justify-between px-4">
          <motion.img
            src="https://cdn.b3.fun/b3_logo_black.svg"
            alt="B3 Logo"
            className="h-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          />
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <a
              href="https://docs.b3.fun"
              className="text-b3-grey font-neue-montreal hover:text-b3-blue transition-colors"
            >
              Documentation
            </a>
          </motion.div>
        </nav>
      </header>
      <main className="pt-16">{children}</main>
    </div>
  );
}
