import { createStyles, makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import GraphiQL from 'graphiql';
import GraphiQLExplorer from 'graphiql-explorer';
import 'graphiql/graphiql.css';
import { buildClientSchema, getIntrospectionQuery, GraphQLSchema, parse } from 'graphql';
import jwtDecode from 'jwt-decode';
import { useSnackbar } from 'notistack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth0 } from './Auth0Provider';
import AuthConfigDialog, { Form } from './AuthConfigDialog';
import { EMAIL_CLAIM, LOCAL_STORAGE_PREFIX } from './constants';

const LOCAL_STORAGE_PREFIX = 'graphgl-studio:';
const EMAIL_CLAIM = 'https://automatic.dealerinspire.com/email';

function fetcher(token: string | undefined) {
    return (params: Object) =>
        fetch('https://dev.api.di-automatic.net/graphql', {
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
        root: {},
        main: {
            height: '100vh',
            width: '100vw',
        },
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

    useEffect(() => {
        const authConfig = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}authConfig`);

        if (!authConfig) return;

        const data = JSON.parse(authConfig);

        setAuth0Options(data.dev);
    }, [setAuth0Options]);

    const fetchSchema = useCallback(
        (token: string) =>
            fetcher(token)({ query: getIntrospectionQuery() })
                .then((result) => {
                    setSchema(buildClientSchema(result.data));
                })
                .catch((e) => {
                    setSchema(undefined);
                    enqueueSnackbar(`${e.toString()}. Probably invalid token`, { variant: 'error' });
                }),
        [enqueueSnackbar]
    );

    useEffect(() => {
        (async () => {
            if (!user) return;

            const token = await getTokenSilently();

            const jwtData = jwtDecode<{ [EMAIL_CLAIM]: string }>(token);

            // TODO: recheck, maybe separate from the other token
            setToken(token);
            setEmail(jwtData[EMAIL_CLAIM]);
            fetchSchema(token);
        })();
    }, [fetchSchema, getTokenSilently, user]);

    const handleInspectOperation = useCallback(
        (cm: any, mousePos: { line: Number; ch: Number }) => (cm: any, mousePos: { line: Number; ch: Number }) => {
            const parsedQuery = parse(query || '');

            if (!parsedQuery) {
                console.error("Couldn't parse query document");
                return null;
            }

            var token = cm.getTokenAt(mousePos);
            var start = { line: mousePos.line, ch: token.start };
            var end = { line: mousePos.line, ch: token.end };
            var relevantMousePos = {
                start: cm.indexFromPos(start),
                end: cm.indexFromPos(end),
            };

            var position = relevantMousePos;

            var def = parsedQuery.definitions.find((definition) => {
                if (!definition.loc) {
                    console.log('Missing location information for definition');
                    return false;
                }

                const { start, end } = definition.loc;
                return start <= position.start && end >= position.end;
            });

            if (!def) {
                console.error('Unable to find definition corresponding to mouse position');
                return null;
            }

            var operationKind = def.kind === 'OperationDefinition' ? def.operation : def.kind === 'FragmentDefinition' ? 'fragment' : 'unknown';

            var operationName =
                def.kind === 'OperationDefinition' && !!def.name
                    ? def.name.value
                    : def.kind === 'FragmentDefinition' && !!def.name
                    ? def.name.value
                    : 'unknown';

            var selector = `.graphiql-explorer-root #${operationKind}-${operationName}`;

            var el = document.querySelector(selector);
            el && el.scrollIntoView();
        },
        [query]
    );

    useEffect(() => {
        if (!graphiql.current) return;

        const editor = graphiql.current.getQueryEditor();
        editor.setOption('extraKeys', {
            ...(editor.options.extraKeys || {}),
            'Shift-Alt-LeftClick': handleInspectOperation,
        });
    }, [handleInspectOperation]);

    useEffect(() => {
        try {
            const token = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}token`);

            if (!token) return;

            const jwtData = jwtDecode<{ ['https://automatic.dealerinspire.com/email']: string }>(token);

            setToken(token);
            setEmail(jwtData['https://automatic.dealerinspire.com/email']);
            fetchSchema(token);
        } catch (e) {
            enqueueSnackbar(e.toString(), { variant: 'error' });
        }
    }, [enqueueSnackbar, fetchSchema]);

    const handleToggleExplorer = () => setExplorerIsOpen((prev) => !prev);

    const handleToken = () => {
        try {
            const token = prompt('Token', '')?.replace('Bearer ', '').trim();

            if (!token) {
                setToken('');
                setEmail('');
                localStorage.setItem(`${LOCAL_STORAGE_PREFIX}token`, '');
                return;
            }

            const jwtData = jwtDecode<{ ['https://automatic.dealerinspire.com/email']: string }>(token);

            setToken(token);
            setEmail(jwtData['https://automatic.dealerinspire.com/email']);
            localStorage.setItem(`${LOCAL_STORAGE_PREFIX}token`, token);

            fetchSchema(token);
        } catch (e) {
            enqueueSnackbar(e.toString(), { variant: 'error' });
        }
    };

    const handleAuthConfigClick = () => {
        setAuthConfigDialogOpen(true);
    };

    const handleAuthSelect = (env: string) => () => {
        loginWithPopup({});
    };

    const handleLogoutClick = () => {
        logout({ returnTo: process.env.PUBLIC_URL });
    };

    const handleAuthDialogClose = () => {
        setAuthConfigDialogOpen(false);
    };

    const handleAuthDialogCancel = () => {
        setAuthConfigDialogOpen(false);
    };

    const handleAuthDialogOk = (data: Form) => {
        setAuthConfigDialogOpen(false);
        setAuth0Options(data);
        localStorage.setItem(`${LOCAL_STORAGE_PREFIX}authConfig`, JSON.stringify({ dev: data }));
    };

    return (
        <div className={classes.root}>
            <div className={clsx('graphiql-container', classes.main)}>
                <GraphiQLExplorer
                    schema={schema}
                    query={query}
                    onEdit={setQuery}
                    onRunOperation={(operationName: string) => graphiql.current.handleRunQuery(operationName)}
                    explorerIsOpen={explorerIsOpen}
                    onToggleExplorer={handleToggleExplorer}
                />
                <GraphiQL ref={graphiql} fetcher={fetcher(token)} schema={schema} query={query} onEditQuery={setQuery}>
                    <GraphiQL.Toolbar>
                        <GraphiQL.Button
                            onClick={() => graphiql.current.handlePrettifyQuery()}
                            label="Prettify"
                            title="Prettify Query (Shift-Ctrl-P)"
                        />
                        <GraphiQL.Button onClick={() => graphiql.current.handleToggleHistory()} label="History" title="Show History" />
                        <GraphiQL.Button onClick={handleToggleExplorer} label="Explorer" title="Toggle Explorer" />
                        {/* <GraphiQL.Button onClick={handleAuthClick} label="Auth" title="Auth" /> */}
                        <GraphiQL.Menu label="Auth" title="Auth">
                            <GraphiQL.MenuItem label="config" value="config" onSelect={handleAuthConfigClick} />
                            <GraphiQL.MenuItem label="dev" value="dev" onSelect={handleAuthSelect('dev')} />
                        </GraphiQL.Menu>
                        <GraphiQL.Button
                            onClick={handleToken}
                            label={'Token' + (email ? ' (x)' : '')}
                            title={'Set custom Token' + (email ? ' (' + email + ')' : '')}
                        />
                        {isAuthenticated && <GraphiQL.Button label="Logout" title="Logout" onClick={handleLogoutClick} />}
                    </GraphiQL.Toolbar>
                </GraphiQL>
            </div>

            <AuthConfigDialog
                open={authConfigDialogOpen}
                onClose={handleAuthDialogClose}
                onCancel={handleAuthDialogCancel}
                onOk={handleAuthDialogOk}
            />
        </div>
    );
}

export default App;
