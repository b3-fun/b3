import { getExplorerTxUrl } from "@b3dotfun/sdk/anyspend";
import { MintButton, SendETHButton, useB3 } from "@b3dotfun/sdk/global-account/react";
import { thirdwebB3Mainnet } from "@b3dotfun/sdk/shared/constants/chains/b3Chain";
import { b3MainnetThirdWeb, supportedChainsTW } from "@b3dotfun/sdk/shared/constants/chains/supported";
import createDebug from "debug";
import invariant from "invariant";
import { Bug, UnlinkIcon, User, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useActiveAccount, useLinkProfile, useProfiles, useUnlinkProfile } from "thirdweb/react";
import { createWallet, type Profile } from "thirdweb/wallets";
import { parseUnits } from "viem";
import { SuccessModal } from "../components/SuccessModal";
import { Background } from "../components/ui/Background";
import { client } from "../utils/thirdweb";

interface DebugInfo {
  userEmail?: string;
  walletAddress?: string;
  profiles?: Profile[];
}

const debug = createDebug("@@b3dotfun/sdk:Debug");

const _base = supportedChainsTW.find(chain => chain.id === 8453);
invariant(_base, "Base chain not found");
const base = _base;

export function Debug() {
  const { user, account } = useB3();
  const activeAccount = useActiveAccount();
  const profiles = useProfiles({ client });
  const { mutate: unlinkProfile, isPending: isUnlinkPending } = useUnlinkProfile();
  const { mutate: linkProfile, isPending: isLinkPending } = useLinkProfile();
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({});
  const [unlinkStatus, setUnlinkStatus] = useState<string>("");
  const [linkStatus, setLinkStatus] = useState<string>("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successExplorerTxUrl, setSuccessExplorerTxUrl] = useState<string | null>(null);

  useEffect(() => {
    // Update debug info when user changes
    const updateDebugInfo = async () => {
      if (!account?.address || !profiles.data) return;

      setDebugInfo({
        userEmail: user?.email,
        walletAddress: account?.address,
        profiles: profiles.data,
      });
    };
    updateDebugInfo();
  }, [user, activeAccount?.address, account?.address, profiles.data]);

  const handleUnlinkProfile = async (profile: Profile) => {
    try {
      setUnlinkStatus("Unlinking profile...");

      unlinkProfile({
        client,
        profileToUnlink: profile,
      });

      // The profiles query will automatically update
      setUnlinkStatus("Profile unlinked successfully!");
    } catch (error) {
      debug("Error unlinking profile:", error);
      setUnlinkStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleLinkWallet = async () => {
    try {
      setLinkStatus("Linking wallet...");
      linkProfile({
        client,
        strategy: "wallet",
        wallet: createWallet("io.metamask"),
        chain: b3MainnetThirdWeb,
      });
      setLinkStatus("Wallet linked successfully!");
    } catch (error) {
      debug("Error linking wallet:", error);
      setLinkStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleLinkGuest = async () => {
    try {
      setLinkStatus("Linking guest...");
      linkProfile({
        client,
        strategy: "guest",
      });
      setLinkStatus("Guest linked successfully!");
    } catch (error) {
      debug("Error linking wallet:", error);
      setLinkStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  const handleLinkCoinbase = async () => {
    try {
      setLinkStatus("Linking coinbase...");
      linkProfile({
        client,
        strategy: "wallet",
        wallet: createWallet("com.coinbase.wallet"),
        chain: b3MainnetThirdWeb,
      });
      setLinkStatus("Coinbase linked successfully!");
    } catch (error) {
      debug("Error linking wallet:", error);
      setLinkStatus(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div className="relative min-h-screen pt-20">
      <Background />
      <div className="container mx-auto max-w-4xl space-y-8 p-8">
        <div className="flex items-center gap-4">
          <Bug className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Debug</h1>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Actions</h2>
          {activeAccount && (
            <div className="flex flex-col gap-4">
              <MintButton
                contractAddress={"0xa8e42121e318e3D3BeD7f5969AF6D360045317DD"}
                chain={b3MainnetThirdWeb}
                tokenId={7}
                account={activeAccount}
                to={activeAccount.address as `0x${string}`}
                className="bg-b3-blue w-full rounded-lg font-bold text-white"
                onSuccess={txhash => {
                  setSuccessExplorerTxUrl(getExplorerTxUrl(8333, txhash));
                  setShowSuccessModal(true);
                }}
              />
              <SendETHButton
                account={activeAccount}
                chain={thirdwebB3Mainnet}
                to="0x58241893EF1f86C9fBd8109Cd44Ea961fDb474e1"
                value={parseUnits("0.000000001", 18)}
                className="bg-b3-blue w-full rounded-lg font-bold text-white"
                children="Send 0.000000001 ETH on B3 Mainnet to 0x5824...474e1"
                onSuccess={txhash => {
                  setSuccessExplorerTxUrl(getExplorerTxUrl(thirdwebB3Mainnet.id, txhash));
                  setShowSuccessModal(true);
                }}
              />

              <SendETHButton
                account={activeAccount}
                chain={base}
                to="0x58241893EF1f86C9fBd8109Cd44Ea961fDb474e1"
                value={parseUnits("0.000000001", 18)}
                className="bg-b3-blue w-full rounded-lg font-bold text-white"
                children="Send 0.000000001 ETH on Base to 0x5824...474e1"
                onSuccess={txhash => {
                  setSuccessExplorerTxUrl(getExplorerTxUrl(base.id, txhash));
                  setShowSuccessModal(true);
                }}
              />
            </div>
          )}
        </div>

        {/* Link New Wallet Section */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Link New Wallet</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLinkWallet}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
              disabled={isLinkPending}
            >
              <Wallet className="h-4 w-4" />
              {isLinkPending ? "Linking..." : "Link MetaMask"}
            </button>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={handleLinkGuest}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
              disabled={isLinkPending}
            >
              <User className="h-4 w-4" />
              {isLinkPending ? "Linking..." : "Link Guest"}
            </button>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={handleLinkCoinbase}
              className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
              disabled={isLinkPending}
            >
              <Wallet className="h-4 w-4" />
              {isLinkPending ? "Linking..." : "Link Coinbase"}
            </button>
          </div>
          <div className="mt-4 flex items-center gap-4">
            {linkStatus && (
              <span className={`text-sm ${linkStatus.includes("Error") ? "text-red-500" : "text-green-500"}`}>
                {linkStatus}
              </span>
            )}
          </div>
        </div>

        {/* Existing Debug Info Section */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="mb-8 grid gap-6">
            <h2 className="font-neue-montreal-medium text-2xl">Debug Information</h2>

            <div className="grid gap-4">
              <DebugItem label="User Email" value={debugInfo.userEmail} />
              <DebugItem label="Wallet Address" value={debugInfo.walletAddress} />
              <div className="space-y-2">
                <h3 className="font-neue-montreal-medium text-lg">Connected Profiles</h3>
                {debugInfo.profiles?.map((profile, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg bg-gray-50 p-4">
                    <div>
                      <p className="font-neue-montreal-medium text-sm text-gray-600">Type: {profile.type}</p>
                      <p className="font-mono text-sm">
                        {profile.details.email ||
                          profile.details.address ||
                          profile.details.phone ||
                          profile.details.id}
                      </p>
                    </div>
                    <button
                      onClick={() => handleUnlinkProfile(profile)}
                      className="flex items-center gap-2 rounded-lg bg-red-500 px-3 py-1 text-sm text-white transition-colors hover:bg-red-600"
                      disabled={isUnlinkPending}
                    >
                      <UnlinkIcon className="h-4 w-4" />
                      {isUnlinkPending ? "Unlinking..." : "Unlink"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {unlinkStatus && (
            <div className="border-t border-gray-200 pt-4">
              <p className={`text-sm ${unlinkStatus.includes("Error") ? "text-red-500" : "text-green-500"}`}>
                {unlinkStatus}
              </p>
            </div>
          )}
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        explorerTxUrl={successExplorerTxUrl || undefined}
        title="Success!"
      />
    </div>
  );
}

function DebugItem({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      <p className="font-neue-montreal-medium mb-1 text-sm text-gray-600">{label}</p>
      <p className="font-mono text-sm">{value || "N/A"}</p>
    </div>
  );
}
