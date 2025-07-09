import { useEffect, useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { generateWallet } from "../utils/wallet";
import { Account } from "thirdweb/wallets";
import { useB3 } from "@b3dotfun/sdk/global-account/react";

const Container = styled.div`
  background: #2a2a2a;
  border-radius: 16px;
  padding: 24px;
  max-width: 600px;
  margin: 20px auto;
  box-shadow: 0 0 40px rgb(99 33 33 / 30%);
  border: 2px solid rgb(87 83 83 / 50%);
  font-family: "Outfit", system-ui, sans-serif;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(45deg, #ff4444, #ff8844);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const WalletInfo = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin: 12px 0;
`;

const Label = styled.div`
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin-bottom: 4px;
`;

const Value = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 12px;
`;

const KeyText = styled.div`
  color: white;
  font-family: monospace;
  font-size: 1rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CopyButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 6px;
  padding: 4px 12px;
  color: white;
  cursor: pointer;
  font-size: 0.8rem;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const Warning = styled.div`
  color: rgba(255, 68, 68, 0.8);
  font-size: 0.9rem;
  text-align: center;
  margin-top: 16px;
  padding: 12px;
  border: 1px solid rgba(255, 68, 68, 0.3);
  border-radius: 8px;
`;

export function LocalWallet({
  onGenerate,
}: {
  onGenerate: (wallet: { account: Account; address: `0x${string}`; privateKey: `0x${string}` }) => void;
}) {
  const [copied, setCopied] = useState<"address" | "privateKey" | null>(null);
  const [wallet, setWallet] = useState<{ account: Account; address: string; privateKey: string } | null>(null);

  const b3 = useB3();
  console.log("b32", b3);
  useEffect(() => {
    const generateLocalWallet = async () => {
      const wallet = await generateWallet();
      setWallet(wallet);
      onGenerate(wallet);
    };
    generateLocalWallet();
  }, [onGenerate]);

  const copyToClipboard = async (text: string, type: "address" | "privateKey") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!wallet) {
    return (
      <Container>
        <Title>Generating Wallet...</Title>
      </Container>
    );
  }

  return (
    <Container>
      <Title>Local Wallet</Title>

      <WalletInfo>
        <Label>Address</Label>
        <Value>
          <KeyText>{wallet.address}</KeyText>
          <CopyButton whileTap={{ scale: 0.95 }} onClick={() => copyToClipboard(wallet.address, "address")}>
            {copied === "address" ? "Copied!" : "Copy"}
          </CopyButton>
        </Value>
      </WalletInfo>

      <WalletInfo>
        <Label>Private Key</Label>
        <Value>
          <KeyText>{wallet.privateKey}</KeyText>
          <CopyButton whileTap={{ scale: 0.95 }} onClick={() => copyToClipboard(wallet.privateKey, "privateKey")}>
            {copied === "privateKey" ? "Copied!" : "Copy"}
          </CopyButton>
        </Value>
      </WalletInfo>

      <Warning>⚠️ Never share your private key! Keep it safe and secure.</Warning>
    </Container>
  );
}
