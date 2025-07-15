import { B3DynamicModal } from "@b3dotfun/sdk/global-account/react";
import { useState } from "react";
import { Account } from "thirdweb/wallets";

import "./App.css";
import { B3 } from "./B3";
import { Game } from "./components/Game";
import { LocalWallet } from "./components/LocalWallet";
import { Providers } from "./components/Providers";
import { GameStyles } from "./styles/GameStyles";

function App() {
  const [walletAccount, setWalletAccount] = useState<{
    account: Account;
    address: `0x${string}`;
    privateKey: `0x${string}`;
  } | null>(null);

  return (
    <Providers>
      <div className="bg" />
      <div style={{ position: "relative", zIndex: 1 }}>
        <GameStyles />
        {walletAccount && <Game signerAccount={walletAccount?.account} sessionKeyAddress={walletAccount?.address} />}
        <LocalWallet onGenerate={setWalletAccount} />
        {walletAccount && (
          <div style={{ position: "fixed", top: "45px", left: "45px", width: "100%" }}>
            <B3 sessionKeyAddress={walletAccount.address} />
          </div>
        )}
        <B3DynamicModal />
      </div>
    </Providers>
  );
}

export default App;
