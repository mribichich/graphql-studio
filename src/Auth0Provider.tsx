// src/react-auth0-spa.js
import createAuth0Client, {
    Auth0Client,
    Auth0ClientOptions,
    getIdTokenClaimsOptions,
    GetTokenSilentlyOptions,
    GetTokenWithPopupOptions,
    IdToken,
    LogoutOptions,
    PopupConfigOptions,
    RedirectLoginOptions,
} from '@auth0/auth0-spa-js';
import React, { FC, useContext, useEffect, useState } from 'react';

type ContextProps = {
    isAuthenticated: boolean;
    loading: boolean;
    popupOpen: boolean;
    user?: any;

    // setUser: (user?: User | undefined) => void;
    setAuth0Options: (options: Auth0ClientOptions | undefined) => void;
    loginWithPopup: (params: object) => Promise<void>;
    handleRedirectCallback: () => Promise<void>;
    getIdTokenClaims: (options?: getIdTokenClaimsOptions) => Promise<IdToken>;
    loginWithRedirect: (options?: RedirectLoginOptions) => void;
    getTokenSilently: (options?: GetTokenSilentlyOptions) => Promise<string>;
    getTokenWithPopup: (options?: GetTokenWithPopupOptions, config?: PopupConfigOptions) => void;
    logout: (options?: LogoutOptions) => void;
};

export const Auth0Context = React.createContext<ContextProps>({} as ContextProps);
export const useAuth0 = () => useContext(Auth0Context);

export const Auth0Provider: FC = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [user, setUser] = useState();
    const [auth0Client, setAuth0] = useState<Auth0Client>();
    const [loading, setLoading] = useState(true);
    const [popupOpen, setPopupOpen] = useState(false);
    const [auth0Options, setAuth0Options] = useState<Auth0ClientOptions>();

    useEffect(() => {
        if (!auth0Options) return;

        const initAuth0 = async () => {
            const auth0FromHook = await createAuth0Client(auth0Options);
            setAuth0(auth0FromHook);

            if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
                const { appState } = await auth0FromHook.handleRedirectCallback();
                // onRedirectCallback && onRedirectCallback(appState);
            }

            const isAuthenticated = await auth0FromHook.isAuthenticated();

            setIsAuthenticated(isAuthenticated);

            if (isAuthenticated) {
                const user = await auth0FromHook.getUser();
                setUser(user);
            }

            setLoading(false);
        };
        initAuth0();
    }, [auth0Options]);

    const loginWithPopup = async (params = {}) => {
        if (!auth0Client) return;

        setPopupOpen(true);
        try {
            await auth0Client.loginWithPopup(params);
        } catch (error) {
            console.error(error);
        } finally {
            setPopupOpen(false);
        }
        const user = await auth0Client.getUser();
        setUser(user);
        setIsAuthenticated(true);
    };

    const handleRedirectCallback = async () => {
        if (!auth0Client) return;

        setLoading(true);
        await auth0Client.handleRedirectCallback();
        const user = await auth0Client.getUser();
        setLoading(false);
        setIsAuthenticated(true);
        setUser(user);
    };

    return (
        <Auth0Context.Provider
            value={{
                isAuthenticated,
                user,
                loading,
                popupOpen,
                setAuth0Options,
                loginWithPopup,
                handleRedirectCallback,
                getIdTokenClaims: (options?: getIdTokenClaimsOptions) => (auth0Client as Auth0Client).getIdTokenClaims(options),
                loginWithRedirect: (options?: RedirectLoginOptions) => (auth0Client as Auth0Client).loginWithRedirect(options),
                getTokenSilently: (options?: GetTokenSilentlyOptions) => (auth0Client as Auth0Client).getTokenSilently(options),
                getTokenWithPopup: (options?: GetTokenWithPopupOptions, config?: PopupConfigOptions) =>
                    (auth0Client as Auth0Client).getTokenWithPopup(options, config),
                logout: (options?: LogoutOptions) => (auth0Client as Auth0Client).logout(options),
            }}
        >
            {children}
        </Auth0Context.Provider>
    );
};
