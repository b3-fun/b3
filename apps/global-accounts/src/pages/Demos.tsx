import { SignInWithB3, useAuthentication, useAuthStore, useB3Config } from "@b3dotfun/sdk/global-account/react";
import { useB3Account } from "@b3dotfun/sdk/global-account/react/components/B3Provider/useB3Account";
import { useEffect, useState } from "react";
import { b3Chain } from "../constants/b3Chain";

export function Demos() {
  const { partnerId } = useB3Config();
  const { user } = useAuthentication(partnerId);
  const account = useB3Account();
  const { isAuthenticating } = useAuthStore();
  const [authMessage, setAuthMessage] = useState("");

  // Check if embedded mode (for iframes)
  const isEmbedded = new URLSearchParams(window.location.search).get("embedded") === "true";
  const selectedHash = window.location.hash.replace("#", "");

  // Handle hash scrolling after content renders
  useEffect(() => {
    if (window.location.hash) {
      // Small delay to ensure content is rendered
      setTimeout(() => {
        const element = document.querySelector(window.location.hash);
        if (element) {
          // Use scrollTop to control internal scrolling without affecting parent
          const elementTop = element.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: elementTop,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  }, []);

  // Helper function to determine if a section should be shown
  const shouldShowSection = (sectionId: string) => {
    // If not embedded or no hash, show all sections
    if (!isEmbedded || !selectedHash) return true;
    // If embedded with hash, only show the selected section
    return sectionId === selectedHash;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Hide in embedded mode */}
      {!isEmbedded && (
        <div className="bg-gradient-to-b from-gray-50 to-white py-16">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="mb-4 text-5xl font-bold text-gray-900">Authentication Demos</h1>
              <p className="text-lg text-gray-600">
                Interactive examples of B3 Global Accounts authentication with live components
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Navigation - Hide in embedded mode */}
      {!isEmbedded && (
        <div className="sticky top-16 z-40 border-b border-gray-200 bg-white py-6">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-700">Jump to Section</h3>
              <div className="flex flex-wrap gap-2">
                <a
                  href="#auth-full"
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-blue-50 hover:text-blue-600"
                >
                  Full Auth Demo
                </a>
                <a
                  href="#auth-google"
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-blue-50 hover:text-blue-600"
                >
                  Google Only
                </a>
                <a
                  href="#auth-all"
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-blue-50 hover:text-blue-600"
                >
                  All Strategies
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo Sections */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl space-y-12">
            {/* Full Authentication Demo */}
            {shouldShowSection("auth-full") && (
              <div id="auth-full" className="rounded-2xl bg-white p-8 shadow-sm">
                <h2 className="mb-4 text-3xl font-bold text-gray-900">Authentication Demo</h2>
                <p className="mb-6 text-gray-600">
                  Try B3 authentication with multiple providers. This is a live, interactive component using the actual
                  B3 SDK.
                </p>

                <div className="mb-4">
                  <SignInWithB3
                    strategies={["google", "discord", "x"]}
                    chain={b3Chain}
                    partnerId={String(process.env.PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID)}
                    onLoginSuccess={globalAccount => {
                      setAuthMessage(`✅ Successfully authenticated! Welcome ${globalAccount.address}`);
                      setTimeout(() => setAuthMessage(""), 5000);
                    }}
                    onError={async error => {
                      setAuthMessage(`❌ Authentication failed: ${error.message}`);
                      setTimeout(() => setAuthMessage(""), 5000);
                    }}
                  />
                </div>

                {authMessage && (
                  <div
                    className={`mb-4 rounded-md p-3 text-sm ${
                      authMessage.includes("✅") ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                    }`}
                  >
                    {authMessage}
                  </div>
                )}

                {isAuthenticating && (
                  <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                    <span>Authenticating...</span>
                  </div>
                )}

                {account && (
                  <div className="rounded-md bg-gray-50 p-4">
                    <h4 className="mb-2 text-sm font-semibold text-gray-900">Authenticated Account</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="font-medium text-gray-700">Address:</span>
                        <code className="flex-1 rounded bg-white px-2 py-1 font-mono text-xs text-gray-900">
                          {account.address}
                        </code>
                      </div>
                      {user?.username && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-gray-700">Username:</span>
                          <span className="text-gray-900">{user.username}</span>
                        </div>
                      )}
                      {user?.email && (
                        <div className="flex items-start gap-2">
                          <span className="font-medium text-gray-700">Email:</span>
                          <span className="text-gray-900">{user.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 rounded-md bg-blue-50 p-4">
                  <p className="text-xs text-blue-900">
                    💡 <strong>Tip:</strong> This is a live, interactive component using the actual B3 SDK. Try
                    different authentication providers to see how they work.
                  </p>
                </div>
              </div>
            )}

            {/* Google Only Authentication */}
            {shouldShowSection("auth-google") && (
              <div id="auth-google" className="rounded-2xl bg-white p-8 shadow-sm">
                <h2 className="mb-4 text-3xl font-bold text-gray-900">Google Authentication Only</h2>
                <p className="mb-6 text-gray-600">
                  Single authentication provider example showing Google OAuth integration.
                </p>
                <SignInWithB3
                  strategies={["google"]}
                  chain={b3Chain}
                  partnerId={String(process.env.PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID)}
                  onLoginSuccess={globalAccount => {
                    console.log("Google auth successful:", globalAccount);
                  }}
                />
                <div className="mt-6 rounded-md border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs text-gray-700">
                    <strong>Usage:</strong> Specify a single strategy in the{" "}
                    <code className="rounded bg-white px-1 py-0.5 font-mono text-xs">strategies</code> array to show
                    only that authentication option.
                  </p>
                </div>
              </div>
            )}

            {/* All Strategies Authentication */}
            {shouldShowSection("auth-all") && (
              <div id="auth-all" className="rounded-2xl bg-white p-8 shadow-sm">
                <h2 className="mb-4 text-3xl font-bold text-gray-900">All Authentication Options</h2>
                <p className="mb-6 text-gray-600">
                  When you don't specify strategies, all available authentication options are displayed.
                </p>
                <SignInWithB3
                  chain={b3Chain}
                  partnerId={String(process.env.PUBLIC_GLOBAL_ACCOUNTS_PARTNER_ID)}
                  onLoginSuccess={globalAccount => {
                    console.log("Auth successful:", globalAccount);
                  }}
                />
                <div className="mt-6 rounded-md border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs text-gray-700">
                    <strong>Usage:</strong> Omit the{" "}
                    <code className="rounded bg-white px-1 py-0.5 font-mono text-xs">strategies</code> prop to show all
                    available authentication methods including social logins and wallet connections.
                  </p>
                </div>
              </div>
            )}

            {/* Code Example Reference - Only show when not in embedded mode with hash */}
            {!isEmbedded && (
              <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 p-8 shadow-sm">
                <h2 className="mb-4 text-2xl font-bold text-gray-900">Want to integrate this?</h2>
                <p className="mb-4 text-gray-700">
                  Check out the{" "}
                  <a
                    href="https://docs.b3.fun/sdk/global-account/authentication"
                    className="font-medium text-blue-600 underline hover:text-blue-700"
                  >
                    full documentation
                  </a>{" "}
                  for code examples, API reference, and integration guides.
                </p>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://docs.b3.fun/sdk/global-account/authentication"
                    className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    View Documentation
                  </a>
                  <a
                    href="https://github.com/b3-fun/b3"
                    className="rounded-lg border-2 border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-900 transition-colors hover:border-gray-400"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on GitHub
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
