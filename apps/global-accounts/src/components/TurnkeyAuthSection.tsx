import app from "@b3dotfun/sdk/global-account/app";
import { useAuthStore, useB3 } from "@b3dotfun/sdk/global-account/react";
import { useState } from "react";
import { TurnkeyAuthModal } from "./TurnkeyAuthModal";

export function TurnkeyAuthSection() {
  const { user } = useB3();
  const { isAuthenticated } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [turnkeyWalletAddress, setTurnkeyWalletAddress] = useState<string | null>(null);

  const handleLoginSuccess = (authenticatedUser: any, walletAddress: string) => {
    console.log("Turnkey login successful!", authenticatedUser);
    setTurnkeyWalletAddress(walletAddress);
    setIsModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      await app.logout();
      setTurnkeyWalletAddress(null);
      console.log("Logged out successfully");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <>
      {!isAuthenticated ? (
        // Not authenticated - show login button
        <div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-all duration-200 hover:bg-blue-700 sm:w-auto"
          >
            Login with Turnkey
          </button>
          <p className="mt-4 text-sm text-gray-600">
            Click the button above to authenticate using your email address. You'll receive a verification code to
            complete the login process.
          </p>
        </div>
      ) : (
        // Authenticated - show user info
        <div className="space-y-4">
          <div className="rounded-md bg-gray-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-900">Authenticated Account</h4>
            <div className="space-y-2 text-sm">
              {user?.email && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="text-gray-900">{user.email}</span>
                </div>
              )}
              {turnkeyWalletAddress && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-gray-700">Turnkey Wallet:</span>
                  <code className="flex-1 break-all rounded bg-white px-2 py-1 font-mono text-xs text-gray-900">
                    {turnkeyWalletAddress}
                  </code>
                </div>
              )}
              {user?.smartAccountAddress && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-gray-700">Smart Account:</span>
                  <code className="flex-1 break-all rounded bg-white px-2 py-1 font-mono text-xs text-gray-900">
                    {user.smartAccountAddress}
                  </code>
                </div>
              )}
              {user?.username && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-gray-700">Username:</span>
                  <span className="text-gray-900">{user.username}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-200 bg-white px-6 py-2 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50"
            >
              Logout
            </button>
          </div>

          <div className="rounded-md bg-green-50 p-4">
            <p className="text-xs text-green-900">
              ✅ <strong>Success!</strong> You're now authenticated with Turnkey. Your session persists across page
              refreshes using the b3-api JWT stored in cookies.
            </p>
          </div>
        </div>
      )}

      <TurnkeyAuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={handleLoginSuccess} />
    </>
  );
}
