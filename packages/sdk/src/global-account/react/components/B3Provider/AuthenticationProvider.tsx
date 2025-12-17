import { useAuthentication } from "../../hooks";
import { useAutoSelectWallet } from "../../hooks/useAutoSelectWallet";

const AuthenticationProvider = ({
  partnerId,
  automaticallySetFirstEoa,
}: {
  partnerId: string;
  automaticallySetFirstEoa: boolean;
}) => {
  useAuthentication(partnerId);
  useAutoSelectWallet({
    enabled: automaticallySetFirstEoa,
  });

  return null;
};

export default AuthenticationProvider;
