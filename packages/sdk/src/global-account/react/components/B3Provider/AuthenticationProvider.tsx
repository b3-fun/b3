import { EIP1193 } from "thirdweb/wallets";
import { useAuthentication } from "../../hooks";
import { useAutoSelectWallet } from "../../hooks/useAutoSelectWallet";

const AuthenticationProvider = ({
  partnerId,
  automaticallySetFirstEoa,
  defaultEoaProvider,
}: {
  partnerId: string;
  automaticallySetFirstEoa: boolean;
  defaultEoaProvider?: EIP1193.EIP1193Provider;
}) => {
  useAuthentication(partnerId);
  useAutoSelectWallet({
    enabled: automaticallySetFirstEoa,
    defaultEoaProvider,
  });

  return null;
};

export default AuthenticationProvider;
