import { Users } from "@b3dotfun/b3-api";
import app from "@b3dotfun/sdk/global-account/app";
import { authenticateWithB3JWT } from "@b3dotfun/sdk/global-account/bsmnt";
import { useAuthStore, useSiwe } from "@b3dotfun/sdk/global-account/react";
import { debugB3React } from "@b3dotfun/sdk/shared/utils/debug";
import { useCallback, useEffect, useState } from "react";
import { useSetActiveWallet } from "thirdweb/react";
import { Wallet } from "thirdweb/wallets";

const debug = debugB3React("useOnConnect");


export function useOnConnect(partnerId: string) {
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const setIsAuthenticating = useAuthStore(state => state.setIsAuthenticating);
    const isAuthenticating = useAuthStore(state => state.isAuthenticating);
    const isConnected = useAuthStore(state => state.isConnected);
    const setIsConnected = useAuthStore(state => state.setIsConnected);
    const setIsAuthenticated = useAuthStore(state => state.setIsAuthenticated);
    const setHasStartedConnecting = useAuthStore(state => state.setHasStartedConnecting);
    const setActiveWallet = useSetActiveWallet();
    const { authenticate } = useSiwe();

    const [user, setUser] = useState<Users | undefined>(() => {
        // Try to restore user from localStorage on initialization
        if (typeof window !== "undefined") {
            try {
                const storedUser = localStorage.getItem("b3-user");
                return storedUser ? JSON.parse(storedUser) : undefined;
            } catch (error) {
                console.warn("Failed to restore user from localStorage:", error);
                return undefined;
            }
        }
        return undefined;
    });


    // Persist user to localStorage when it changes
    useEffect(() => {
        if (user) {
            localStorage.setItem("b3-user", JSON.stringify(user));
        } else {
            localStorage.removeItem("b3-user");
        }
    }, [user]);


    const onConnect = useCallback(async (wallet: Wallet) => {
        debug("@@wagmi:onConnect", { wallet });

        try {
            setHasStartedConnecting(true);
            setIsConnected(true);
            setIsAuthenticating(true);
            await setActiveWallet(wallet);
            const account = await wallet.getAccount();
            if (!account) {
                throw new Error("No account found during auto-connect");
            }

            // Try to re-authenticate first
            try {
                const userAuth = await app.reAuthenticate();
                setUser(userAuth.user);
                setIsAuthenticated(true);
                debug("@@wagmi:onConnect:reauth:success", { userAuth });

                // Authenticate on BSMNT with B3 JWT
                const b3Jwt = await authenticateWithB3JWT(userAuth.accessToken);
                debug("@@wagmi:onConnect:bsmnt:success", { b3Jwt });
            } catch (error) {
                // If re-authentication fails, try fresh authentication
                debug("@@wagmi:onConnect:reauth:failed, attempting fresh auth", { error });
                const userAuth = await authenticate(account, partnerId);
                setUser(userAuth.user);
                setIsAuthenticated(true);
                debug("@@wagmi:onConnect:fresh:success", { userAuth });

                // Authenticate on BSMNT with B3 JWT
                const b3Jwt = await authenticateWithB3JWT(userAuth.accessToken);
                debug("@@wagmi:onConnect:bsmnt:success", { b3Jwt });
            }
        } catch (error) {
            debug("@@wagmi:onConnect:failed", { error });
            setIsAuthenticated(false);
            setUser(undefined);
        } finally {
            setIsAuthenticating(false);
        }

        console.log("@@wtf");
        debug({
            isAuthenticated,
            isAuthenticating,
            isConnected,
        });
    }, []);

    return {
        onConnect,
        user,
        setUser
    };
}
