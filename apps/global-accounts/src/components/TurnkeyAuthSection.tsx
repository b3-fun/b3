import app from "@b3dotfun/sdk/global-account/app";
import { useAuthStore, useB3 } from "@b3dotfun/sdk/global-account/react";
import { useEffect, useState } from "react";
import { TurnkeyAuthModal } from "./TurnkeyAuthModal";

interface TurnkeySubOrg {
  subOrgId: string;
  accounts: Array<{ address: string; [key: string]: unknown }>;
  hasDelegatedUser?: boolean;
}

export function TurnkeyAuthSection() {
  const { user, setUser } = useB3();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const setIsAuthenticated = useAuthStore(state => state.setIsAuthenticated);
  const setIsAuthenticating = useAuthStore(state => state.setIsAuthenticating);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [turnkeySubOrgs, setTurnkeySubOrgs] = useState<TurnkeySubOrg[]>([]);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Auto-reAuthenticate on mount (restore session from JWT in cookies)
  useEffect(() => {
    const restoreSession = async () => {
      try {
        console.log("[TurnkeyAuthSection] Checking for existing session...");
        setIsAuthenticating(true);

        // Try to reAuthenticate using JWT from cookies
        const authResult = await app.reAuthenticate();

        console.log("[TurnkeyAuthSection] Session restored!", authResult);

        // IMPORTANT: Update SDK's user state
        if (authResult.user) {
          setUser(authResult.user);
        }

        setIsAuthenticated(true);

        // Store Turnkey sub-orgs with delegated access info
        if (authResult.user?.turnkeySubOrgs) {
          setTurnkeySubOrgs(authResult.user.turnkeySubOrgs as TurnkeySubOrg[]);
        }
      } catch (error) {
        console.log("[TurnkeyAuthSection] No existing session found");
        setIsAuthenticated(false);
      } finally {
        setIsAuthenticating(false);
        setIsCheckingAuth(false);
      }
    };

    restoreSession();
    // Hey Gio, if I put setUser in the dependency array, it will cause a infinite loop.
    // How can I fix this?
    // }, [setIsAuthenticated, setIsAuthenticating, setUser]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setIsAuthenticated, setIsAuthenticating]);

  const handleLoginSuccess = (authenticatedUser: any, _walletAddresses: string[]) => {
    console.log("Turnkey login successful!", authenticatedUser);

    // IMPORTANT: Update SDK's user state
    if (authenticatedUser) {
      setUser(authenticatedUser);
      // Extract turnkeySubOrgs from user object
      if (authenticatedUser.turnkeySubOrgs) {
        setTurnkeySubOrgs(authenticatedUser.turnkeySubOrgs as TurnkeySubOrg[]);
      }
    }

    setIsModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      await app.logout();
      setIsAuthenticated(false);
      setUser(undefined); // Clear SDK user state
      setTurnkeySubOrgs([]);
      console.log("Logged out successfully");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  // Show loading state while checking for existing session
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
          <span className="text-sm text-gray-600">Checking authentication...</span>
        </div>
      </div>
    );
  }

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
              {turnkeySubOrgs.length > 0 && (
                <div className="space-y-3">
                  <span className="font-medium text-gray-700">Turnkey Wallets:</span>
                  <div className="space-y-2">
                    {turnkeySubOrgs.map((subOrg, index) => (
                      <div key={subOrg.subOrgId || index} className="rounded bg-white p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-medium text-gray-600">Sub-Org {index + 1}</span>
                          {subOrg.hasDelegatedUser !== undefined && (
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                subOrg.hasDelegatedUser
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {subOrg.hasDelegatedUser ? "✅ Delegated" : "⚠️ No Delegation"}
                            </span>
                          )}
                        </div>
                        <div className="space-y-1">
                          {subOrg.accounts.map((account, accIndex) => (
                            <code
                              key={account.address || accIndex}
                              className="block break-all rounded bg-gray-50 px-2 py-1 font-mono text-xs text-gray-900"
                            >
                              {account.address}
                            </code>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
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
