import { createStyles, makeStyles } from '@material-ui/core/styles';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import clsx from 'clsx';
import GraphiQL from 'graphiql';
import GraphiQLExplorer from 'graphiql-explorer';
import 'graphiql/graphiql.css';
import { buildClientSchema, getIntrospectionQuery, GraphQLSchema } from 'graphql';
import jwtDecode from 'jwt-decode';
import { useSnackbar } from 'notistack';
import { isNil } from 'ramda';
import React, { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth0 } from './Auth0Provider';
import AuthConfigDialog from './components/AuthConfigDialog';
import Toolbar from './components/Toolbar';
import { EMAIL_CLAIM, LOCAL_STORAGE_PREFIX } from './constants';
import useDebounce from './hooks/useDebounce';
import { AuthConfigDb } from './types';
import showQueryInExplorer from './utils/showQueryInExplorer';

function fetcher(url: string, token: string | undefined) {
    return (params: Object) =>
        fetch(url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                authorization: token ? 'Bearer ' + token : '',
            },
            body: JSON.stringify(params),
        })
            .then(function (response) {
                return response.text();
            })
            .then(function (responseBody) {
                try {
                    return JSON.parse(responseBody);
                } catch (e) {
                    return responseBody;
                }
            });
}

const useStyles = makeStyles(() =>
    createStyles({
        root: {
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
        },
        header: {
            alignItems: 'center',
            display: 'flex',
            fontSize: 14,
            justifyContent: 'flex-end',
            margin: '8px 8px 0px 8px',

            '& > *:not(:last-child)': {
                marginRight: 8,
            },
        },
        toolbar: {
            margin: 8,
        },
        main: {},
    })
);

function App() {
    const classes = useStyles();
    const [schema, setSchema] = useState<GraphQLSchema>();
    const [query, setQuery] = useState<string>();
    const [token, setToken] = useState<string>();
    const [email, setEmail] = useState<string>();
    const [explorerIsOpen, setExplorerIsOpen] = useState(true);
    const graphiql = useRef<any | null>(null);
    const { enqueueSnackbar } = useSnackbar();
    const { isAuthenticated, loginWithPopup, user, getTokenSilently, logout, setAuth0Options } = useAuth0();
    const [authConfigDialogOpen, setAuthConfigDialogOpen] = useState(false);
    const [url, setUrl] = useState<string>('');
    const debouncedUrl = useDebounce(url, 1000);
    const [authConfigDb, setAuthConfigDb] = useState<AuthConfigDb>({});

    useEffect(() => {
        const url = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}url`);
        const token = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}token`);
        const authConfig = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}authConfig`);

        url && setUrl(url);
        token && setToken(token);
        authConfig && setAuthConfigDb(JSON.parse(authConfig));
    }, []);

    useEffect(() => {
        const authConfig = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}authConfig`);

        if (!authConfig) return;

        const data = JSON.parse(authConfig);

        setAuth0Options(data.dev);
    }, [setAuth0Options]);

    const fetchSchema = useCallback(
        async (url: string, token: string | undefined) => {
            try {
                const result = await fetcher(url, token)({ query: getIntrospectionQuery() });

                setSchema(buildClientSchema(result.data));
            } catch (e) {
                setSchema(undefined);
                enqueueSnackbar(e.toString(), { variant: 'error', preventDuplicate: true });
            }
        },
        [enqueueSnackbar]
    );

    useEffect(() => {
        (async () => {
            if (!user) return;

            const token = await getTokenSilently();

            // TODO: recheck, maybe separate from the other token
            setToken(token);
        })();
    }, [getTokenSilently, user]);

    useEffect(() => {
        if (!graphiql.current) return;

        const editor = graphiql.current.getQueryEditor();
        editor.setOption('extraKeys', {
            ...(editor.options.extraKeys || {}),
            'Shift-Alt-LeftClick': showQueryInExplorer(query),
        });
    }, [query]);

    useEffect(() => {
        if (!debouncedUrl) return;

        fetchSchema(debouncedUrl, token);
    }, [fetchSchema, debouncedUrl, token]);

    useEffect(() => {
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}token`, token || '');

        if (!token) {
            setEmail('');
            return;
        }

        try {
            const jwtData = jwtDecode<{ [EMAIL_CLAIM]: string }>(token);

            setEmail(jwtData[EMAIL_CLAIM]);
        } catch (e) {
            enqueueSnackbar(e.toString(), { variant: 'error', preventDuplicate: true });
        }
    }, [enqueueSnackbar, token]);

    const handleToggleExplorer = () => setExplorerIsOpen((prev) => !prev);

    const handleToken = () => {
        const token = prompt('Token', '');

        if (isNil(token)) return;

        setToken(token.replace('Bearer ', '').trim());
    };

    const handleAuthConfigClick = () => {
        setAuthConfigDialogOpen(true);
    };

    const handleAuthSelect = (env: string) => () => {
        loginWithPopup({});
    };

    const handleLogoutClick = () => {
        logout({ returnTo: process.env.PUBLIC_URL });
        setToken('');
    };

    const handleAuthDialogClose = () => {
        setAuthConfigDialogOpen(false);
    };

    const handleAuthDialogChange = (data: AuthConfigDb) => {
        setAuthConfigDb(data);
    };

    const handleAuthDialogOk = () => {
        setAuthConfigDialogOpen(false);
    };

    const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
        setUrl(e.target.value);
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}url`, url);
    };

    const onRefreshClick = () => debouncedUrl && fetchSchema(debouncedUrl, token);

    return (
        <div className={classes.root}>
            {email && (
                <div className={classes.header}>
                    <div>{email}</div>
                    <AccountCircleIcon color="action" />
                </div>
            )}

            <Toolbar className={classes.toolbar} url={url} onRefreshClick={onRefreshClick} onUrlChange={handleUrlChange} />

            <div className={clsx('graphiql-container', classes.main)}>
                <GraphiQLExplorer
                    schema={schema}
                    query={query}
                    onEdit={setQuery}
                    onRunOperation={(operationName: string) => graphiql.current.handleRunQuery(operationName)}
                    explorerIsOpen={explorerIsOpen}
                    onToggleExplorer={handleToggleExplorer}
                />
                <GraphiQL ref={graphiql} fetcher={fetcher(debouncedUrl, token)} schema={schema} query={query} onEditQuery={setQuery}>
                    <GraphiQL.Toolbar>
                        <GraphiQL.Button
                            onClick={() => graphiql.current.handlePrettifyQuery()}
                            label="Prettify"
                            title="Prettify Query (Shift-Ctrl-P)"
                        />
                        <GraphiQL.Button onClick={() => graphiql.current.handleToggleHistory()} label="History" title="Show History" />
                        <GraphiQL.Button onClick={handleToggleExplorer} label="Explorer" title="Toggle Explorer" />
                        <GraphiQL.Menu label="Auth" title="Auth">
                            <GraphiQL.MenuItem label="config" value="config" onSelect={handleAuthConfigClick} />
                            {Object.keys(authConfigDb).map((name) => (
                                <GraphiQL.MenuItem label={name} value={name} onSelect={handleAuthSelect(name)} />
                            ))}
                        </GraphiQL.Menu>
                        {isAuthenticated && <GraphiQL.Button label="Logout" title="Logout" onClick={handleLogoutClick} />}
                        <GraphiQL.Button onClick={handleToken} label={'Token'} title={'Set custom Token'} />
                    </GraphiQL.Toolbar>
                </GraphiQL>
            </div>

            <AuthConfigDialog
                open={authConfigDialogOpen}
                data={authConfigDb}
                onChange={handleAuthDialogChange}
                onClose={handleAuthDialogClose}
                onOk={handleAuthDialogOk}
            />
        </div>
    );
}

export default App;
