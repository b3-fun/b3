import { motion } from "framer-motion";
import { useState } from "react";

export function PasswordGate({ onAuthorized }: { onAuthorized: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const isDev = import.meta.env.DEV;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "8333") {
      onAuthorized();
      setError(false);
    } else {
      setError(true);
    }
  };

  const handleReset = () => {
    localStorage.removeItem("b3_docs_authorized");
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xs"
      >
        <form onSubmit={handleSubmit} className="rounded-xl bg-white p-8 shadow-lg">
          <img src="https://cdn.b3.fun/b3_logo@.png" alt="B3 Logo" className="mx-auto mb-8 h-8" />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            className="focus:ring-b3-blue mb-4 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2"
            autoFocus
          />
          {error && <p className="mb-4 text-sm text-red-500">Incorrect password</p>}
          <button
            type="submit"
            className="bg-b3-blue font-neue-montreal hover:bg-b3-blue/90 w-full rounded-lg px-4 py-2 text-white transition-colors"
          >
            Enter
          </button>
          {isDev && (
            <button
              type="button"
              onClick={handleReset}
              className="mt-4 w-full text-sm text-gray-500 transition-colors hover:text-gray-700"
            >
              Reset Authorization
            </button>
          )}
        </form>
      </motion.div>
    </div>
  );
}
