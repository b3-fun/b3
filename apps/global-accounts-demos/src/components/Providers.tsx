import { B3DynamicModal, B3Provider } from "@b3dotfun/sdk/global-account/react";
import makeDebug from "debug";
import { ReactNode, useEffect, useState } from "react";
import { Account } from "thirdweb/wallets";

const debug = makeDebug("@@b3:provider");

export function Providers({ children }: { children: ReactNode }) {
  const [accountOverride] = useState<Account | undefined>(undefined);

  debug("@@B3ProviderWrapper:account");
  useEffect(() => {
    // const setActive = async () => {
    //     setAccountOverride(account);
    // };
    // setActive();
  }, []);

  debug("@@B3ProviderWrapper:accountOverride", accountOverride);

  return (
    <B3Provider environment="production" theme="light">
      <B3DynamicModal />
      {children}
    </B3Provider>
  );
}
