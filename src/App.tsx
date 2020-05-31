import { createStyles, makeStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import GraphiQL from 'graphiql';
import GraphiQLExplorer from 'graphiql-explorer';
import 'graphiql/graphiql.css';
import { buildClientSchema, getIntrospectionQuery, GraphQLSchema, parse } from 'graphql';
import jwtDecode from 'jwt-decode';
import React, { useCallback, useEffect, useRef, useState } from 'react';

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
    const [error, setError] = useState<string>();
    const [email, setEmail] = useState<string>();
    const [explorerIsOpen, setExplorerIsOpen] = useState(true);
    const _graphiql = useRef<any | null>(null);

    const _handleInspectOperation = useCallback(
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
        console.log('inside use effect before _graphiql');

        if (!_graphiql.current) return;

        console.log('inside use effect after _graphiql');

        const editor = _graphiql.current.getQueryEditor();
        editor.setOption('extraKeys', {
            ...(editor.options.extraKeys || {}),
            'Shift-Alt-LeftClick': _handleInspectOperation,
        });
    }, [_handleInspectOperation]);

    const fetchSchema = (token: string) =>
        fetcher(token)({ query: getIntrospectionQuery() })
            .then((result) => {
                setSchema(buildClientSchema(result.data));
                setError(undefined);
            })
            .catch((e) => {
                setSchema(undefined);
                setError(e.toString() + '. probabky invalid token');
            });

    const _handleToggleExplorer = () => setExplorerIsOpen((prev) => !prev);

    const _handleToken = () => {
        try {
            const token = window?.prompt('Token', '')?.replace('Bearer ', '').trim();

            const jwtData = jwtDecode<{ ['https://automatic.dealerinspire.com/email']: string }>(token || '');

            setToken(token);
            setEmail(jwtData['https://automatic.dealerinspire.com/email']);
            setError(undefined);

            token && fetchSchema(token);
        } catch (e) {
            setError(e.toString());
        }
    };

    return (
        <div className={classes.root}>
            {error && (
                <div>
                    error: {error}
                    <br></br>
                </div>
            )}

            <div className={clsx('graphiql-container', classes.main)}>
                <GraphiQLExplorer
                    schema={schema}
                    query={query}
                    onEdit={setQuery}
                    onRunOperation={(operationName: string) => _graphiql.current.handleRunQuery(operationName)}
                    explorerIsOpen={explorerIsOpen}
                    onToggleExplorer={_handleToggleExplorer}
                    // getDefaultScalarArgValue={getDefaultScalarArgValue}
                    // makeDefaultArg={makeDefaultArg}
                />
                <GraphiQL ref={_graphiql} fetcher={fetcher(token)} schema={schema} query={query} onEditQuery={setQuery}>
                    <GraphiQL.Toolbar>
                        <GraphiQL.Button
                            onClick={() => _graphiql.current.handlePrettifyQuery()}
                            label="Prettify"
                            title="Prettify Query (Shift-Ctrl-P)"
                        />
                        <GraphiQL.Button onClick={() => _graphiql.current.handleToggleHistory()} label="History" title="Show History" />
                        <GraphiQL.Button onClick={_handleToggleExplorer} label="Explorer" title="Toggle Explorer" />
                        <GraphiQL.Button onClick={_handleToken} label="Token" title="Override Token" />
                        {email}
                    </GraphiQL.Toolbar>
                </GraphiQL>
            </div>
        </div>
    );
}

export default App;
