import { createStyles, makeStyles } from '@material-ui/core/styles';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import clsx from 'clsx';
import GraphiQL from 'graphiql';
import GraphiQLExplorer from 'graphiql-explorer';
import 'graphiql/graphiql.css';
import { buildClientSchema, getIntrospectionQuery, GraphQLSchema } from 'graphql';
import jwtDecode from 'jwt-decode';
import { useSnackbar } from 'notistack';
import parserGraphql from 'prettier/parser-graphql';
import prettier from 'prettier/standalone';
import { filter, isEmpty, isNil, length, not } from 'ramda';
import React, { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth0 } from './Auth0Provider';
import AuthConfigDialog from './components/AuthConfigDialog';
import HeadersDialog from './components/HeadersDialog';
import Toolbar from './components/Toolbar';
import { EMAIL_CLAIM, LOCAL_STORAGE_PREFIX } from './constants';
import useDebounce from './hooks/useDebounce';
import { AuthConfigDb, HeadersConfigDb } from './types';
import fetcher from './utils/fetcher';
import showQueryInExplorer from './utils/showQueryInExplorer';

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
    divider: {
      borderBottom: '1px solid rgb(208 208 208 / 0.5)',
      padding: '0 !important',
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
  const [url, setUrl] = useState<string>('');
  const debouncedUrl = useDebounce(url, 1000);
  const [authConfigDb, setAuthConfigDb] = useState<AuthConfigDb>({});
  const [headersDb, setHeadersDb] = useState<HeadersConfigDb>([]);
  const [headersDialogOpen, setHeadersDialogOpen] = useState(false);
  const [selectedAuth0Env, setSelectedAuth0Env] = useState<string>();
  const [urls, setUrls] = useState<string[]>([]);

  const enabledHeaders = useMemo(() => filter((f) => f.enabled, headersDb), [headersDb]);

  useEffect(() => {
    const url = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}url`);
    const urls = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}urls`);
    const token = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}token`);
    const authConfig = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}authConfig`);
    const selectedAuth0EnvDb = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}selectedAuth0Env`);
    const headers = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}headers`);

    const authConfigJson = authConfig && JSON.parse(authConfig);

    url && setUrl(url);
    urls && setUrls(JSON.parse(urls));
    token && setToken(token);
    authConfigJson && setAuthConfigDb(authConfigJson);
    selectedAuth0EnvDb && setSelectedAuth0Env(selectedAuth0EnvDb);
    authConfigJson && selectedAuth0EnvDb && setAuth0Options(authConfigJson[selectedAuth0EnvDb]);
    headers && setHeadersDb(JSON.parse(headers));
  }, [setAuth0Options]);

  const fetchSchema = useCallback(
    async (url: string, token: string | undefined, headers: HeadersConfigDb) => {
      try {
        const result = await fetcher(url, token, headers)({ query: getIntrospectionQuery() });

        setSchema(buildClientSchema(result.data));
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);

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

    fetchSchema(debouncedUrl, token, enabledHeaders);
  }, [fetchSchema, debouncedUrl, token, enabledHeaders]);

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
    setSelectedAuth0Env(env);
    setAuth0Options(authConfigDb[env]);

    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}selectedAuth0Env`, env);
  };

  const handleLoginClick = () => {
    loginWithPopup({});
  };

  const handleLogoutClick = () => {
    logout({ returnTo: process.env.PUBLIC_URL });
    setToken('');
    setSelectedAuth0Env(undefined);
  };

  const handleAuthDialogClose = () => setAuthConfigDialogOpen(false);

  const handleAuthDialogChange = (data: AuthConfigDb) => setAuthConfigDb(data);

  const handleAuthDialogOk = () => setAuthConfigDialogOpen(false);

  const handleUrlChange = useCallback((e: ChangeEvent<{}>) => {
    const { value } = e.target as HTMLInputElement;

    setUrl(value);
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}url`, value);
  }, []);

  const handleUrlSelected = (event: any, newValue: string | null) => {
    const value = newValue || '';

    setUrl(value);
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}url`, value);
  };

  const handleAddUrlClick = useCallback(() => {
    const newUrls = [...urls, url];

    setUrls(newUrls);
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}urls`, JSON.stringify(newUrls));
  }, [url, urls]);

  const handleRemoveUrlClick = useCallback(
    (url: string) => {
      const index = urls.indexOf(url);
      const newUrls = [...urls.slice(0, index), ...urls.slice(index + 1)];

      setUrls(newUrls);
      localStorage.setItem(`${LOCAL_STORAGE_PREFIX}urls`, JSON.stringify(newUrls));
    },
    [urls]
  );

  const onRefreshClick = () => debouncedUrl && fetchSchema(debouncedUrl, token, enabledHeaders);

  const handleHeadersDialog = () => setHeadersDialogOpen(true);

  const handleHeadersDialogCancel = () => setHeadersDialogOpen(false);
  const handleHeadersDialogOk = (db: HeadersConfigDb) => {
    localStorage.setItem(`${LOCAL_STORAGE_PREFIX}headers`, JSON.stringify(db));

    setHeadersDb(db);
    setHeadersDialogOpen(false);
  };

  const handlePrettifyQuery = () => {
    if (!graphiql.current) return;

    try {
      const editor = graphiql.current.getQueryEditor();

      const currentText = editor.getValue();
      const cursor = editor.getCursor();
      const cursorIndex = editor.indexFromPos(cursor);

      const formatWithCursorResult = prettier.formatWithCursor(currentText, {
        cursorOffset: cursorIndex,
        parser: 'graphql',
        plugins: [parserGraphql],
        printWidth: Math.floor(editor.display.wrapper.clientWidth / 9),
      });

      editor.setValue(formatWithCursorResult.formatted);
      editor.setCursor(editor.posFromIndex(formatWithCursorResult.cursorOffset));
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    }
  };

  return (
    <div className={classes.root}>
      {email && (
        <div className={classes.header}>
          <div>{email}</div>
          <AccountCircleIcon color="action" />
        </div>
      )}

      <Toolbar
        className={classes.toolbar}
        url={url}
        urls={urls}
        onAddUrlClick={handleAddUrlClick}
        onRefreshClick={onRefreshClick}
        onRemoveUrlClick={handleRemoveUrlClick}
        onUrlChange={handleUrlChange}
        onUrlSelected={handleUrlSelected}
      />

      <div className={clsx('graphiql-container', classes.main)}>
        <GraphiQLExplorer
          schema={schema}
          query={query}
          onEdit={setQuery}
          onRunOperation={(operationName: string) => graphiql.current.handleRunQuery(operationName)}
          explorerIsOpen={explorerIsOpen}
          onToggleExplorer={handleToggleExplorer}
        />
        <GraphiQL ref={graphiql} fetcher={fetcher(debouncedUrl, token, enabledHeaders)} schema={schema} query={query} onEditQuery={setQuery}>
          <GraphiQL.Toolbar>
            <GraphiQL.Button onClick={handlePrettifyQuery} label="Prettify" title="Prettify Query (Shift-Ctrl-P)" />
            <GraphiQL.Button onClick={() => graphiql.current.handleToggleHistory()} label="History" title="Show History" />
            <GraphiQL.Button onClick={handleToggleExplorer} label="Explorer" title="Toggle Explorer" />
            <GraphiQL.Menu label={<>Auth {selectedAuth0Env && `(${selectedAuth0Env})`}</>} title="Auth">
              <GraphiQL.MenuItem label="config" value="config" onSelect={handleAuthConfigClick} />
              <li className={classes.divider} />

              {Object.keys(authConfigDb).map((name) => (
                <GraphiQL.MenuItem
                  key={name}
                  label={
                    <span style={{ display: 'flex', justifyContent: 'space-between' }}>
                      {name}
                      {name === selectedAuth0Env && <span>✓</span>}
                    </span>
                  }
                  value={name}
                  onSelect={handleAuthSelect(name)}
                />
              ))}
            </GraphiQL.Menu>
            {not(isAuthenticated) && <GraphiQL.Button label="Login" title="Login" onClick={handleLoginClick} />}
            {isAuthenticated && <GraphiQL.Button label="Logout" title="Logout" onClick={handleLogoutClick} />}
            <GraphiQL.Button onClick={handleToken} label={'Token'} title={'Set custom Token'} />
            <GraphiQL.Button
              onClick={handleHeadersDialog}
              label={<>Headers {not(isEmpty(enabledHeaders)) && `(${length(enabledHeaders)})`}</>}
              title={'Set Headers'}
            />
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

      <HeadersDialog open={headersDialogOpen} data={headersDb} onCancel={handleHeadersDialogCancel} onOk={handleHeadersDialogOk} />
    </div>
  );
}

export default App;
