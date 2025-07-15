import { Account, privateKeyToAccount } from "thirdweb/wallets";

import { client } from "./thirdweb";

export interface Wallet {
  address: `0x${string}`;
  privateKey: `0x${string}`;
  account: Account;
}

export async function generateWallet(): Promise<Wallet> {
  // Generate random bytes for private key
  const privateKeyArray = new Uint8Array(32);
  crypto.getRandomValues(privateKeyArray);

  // Convert to hex
  const privateKey = ("0x" +
    Array.from(privateKeyArray)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("")) as `0x${string}`;

  // Use viem to properly generate the account
  const account = privateKeyToAccount({
    client,
    privateKey,
  });

  console.log("generateWallet:account", account);
  return {
    address: account.address as `0x${string}`,
    privateKey,
    account,
  };
}
