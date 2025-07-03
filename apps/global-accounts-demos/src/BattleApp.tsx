import { B3DynamicModal } from "@b3dotfun/sdk/global-account/react";
import { useState } from "react";
import { Account } from "thirdweb/wallets";
import "./App.css";
import { B3 } from "./B3";
import { BattleGame } from "./components/BattleGame";
import { BattleSplashScreen } from "./components/BattleSplashScreen";
import { LocalWallet } from "./components/LocalWallet";
import { Providers } from "./components/Providers";
import { GameStyles } from "./styles/GameStyles";

function BattleApp() {
  const [walletAccount, setWalletAccount] = useState<{
    account: Account;
    address: `0x${string}`;
    privateKey: `0x${string}`;
  } | null>(null);
  const [gameStarted, setGameStarted] = useState(false);

  return (
    <Providers>
      <div className="bg bg-2" />
      <div style={{ position: "relative", zIndex: 1 }}>
        <GameStyles />
        {walletAccount && !gameStarted && <BattleSplashScreen onStart={() => setGameStarted(true)} />}
        {walletAccount && gameStarted && <BattleGame />}
        {walletAccount && (
          <div style={{ position: "fixed", top: "45px", left: "45px", width: "100%" }}>
            <B3 sessionKeyAddress={walletAccount.address} />
          </div>
        )}
        <LocalWallet onGenerate={setWalletAccount} />
        <B3DynamicModal />
      </div>
    </Providers>
  );
}

export default BattleApp;
