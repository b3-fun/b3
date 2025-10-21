import { B3Provider, SignInWithB3, useB3, useAuthStore } from "@b3dotfun/sdk/global-account/react";
import { useState } from "react";

const b3Chain = {
  id: 8333,
  name: "B3",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpc: "https://mainnet-rpc.b3.fun",
};

// Inner component that uses the hooks
function AuthPreviewInner() {
  const { account, user } = useB3();
  const { isAuthenticating } = useAuthStore();
  const [authMessage, setAuthMessage] = useState("");

  return (
    <div className="not-prose">
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          Try B3 Authentication
        </h3>
        
        <div className="mb-4">
          <SignInWithB3
            strategies={["google", "discord", "x"]}
            chain={b3Chain}
            partnerId="demo-partner-id"
            onLoginSuccess={(globalAccount) => {
              setAuthMessage(`✅ Successfully authenticated! Welcome ${globalAccount.address}`);
              setTimeout(() => setAuthMessage(""), 5000);
            }}
            onError={async (error) => {
              setAuthMessage(`❌ Authentication failed: ${error.message}`);
              setTimeout(() => setAuthMessage(""), 5000);
            }}
          />
        </div>

        {authMessage && (
          <div
            className={`mb-4 rounded-md p-3 text-sm ${
              authMessage.includes("✅")
                ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400"
            }`}
          >
            {authMessage}
          </div>
        )}

        {isAuthenticating && (
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
            <span>Authenticating...</span>
          </div>
        )}

        {account && (
          <div className="rounded-md bg-gray-50 p-4 dark:bg-gray-900">
            <h4 className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
              Authenticated Account
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">Address:</span>
                <code className="flex-1 rounded bg-gray-100 px-2 py-1 font-mono text-xs dark:bg-gray-800">
                  {account.address}
                </code>
              </div>
              {user?.displayName && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                  <span className="text-gray-900 dark:text-white">{user.displayName}</span>
                </div>
              )}
              {user?.email && (
                <div className="flex items-start gap-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                  <span className="text-gray-900 dark:text-white">{user.email}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 rounded-md bg-blue-50 p-3 dark:bg-blue-900/20">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            💡 <strong>Tip:</strong> This is a live, interactive component using the actual B3 SDK. 
            Click the button above to try different authentication providers.
          </p>
        </div>
      </div>
    </div>
  );
}

// Main component with provider wrapper
export const AuthPreview = () => {
  return (
    <B3Provider 
      environment="production" 
      theme="light" 
      partnerId="demo-docs-preview"
    >
      <AuthPreviewInner />
    </B3Provider>
  );
};

// Variant with specific strategy
export const GoogleAuthPreview = () => {
  return (
    <B3Provider 
      environment="production" 
      theme="light" 
      partnerId="demo-docs-preview"
    >
      <div className="not-prose">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            Google Authentication Only
          </h3>
          <SignInWithB3
            strategies={["google"]}
            chain={b3Chain}
            partnerId="demo-partner-id"
            onLoginSuccess={(globalAccount) => {
              console.log("Google auth successful:", globalAccount);
            }}
          />
        </div>
      </div>
    </B3Provider>
  );
};

// Variant with all strategies
export const AllStrategiesPreview = () => {
  return (
    <B3Provider 
      environment="production" 
      theme="light" 
      partnerId="demo-docs-preview"
    >
      <div className="not-prose">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
            All Authentication Options
          </h3>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            When you don't specify strategies, all available options are shown:
          </p>
          <SignInWithB3
            chain={b3Chain}
            partnerId="demo-partner-id"
            onLoginSuccess={(globalAccount) => {
              console.log("Auth successful:", globalAccount);
            }}
          />
        </div>
      </div>
    </B3Provider>
  );
};
