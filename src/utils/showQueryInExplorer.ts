import { parse } from 'graphql';

const showQueryInExplorer = (query: string | undefined) => (cm: any, mousePos: { line: Number; ch: Number }) => {
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
};

export default showQueryInExplorer;
