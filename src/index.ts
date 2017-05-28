if (process.env.NODE_ENV === 'development') {
    require('source-map-support').install();
}

import { attachComments } from './comments';
import { buildDocFromAst } from './printer';
import { printDocToString } from './docPrinter';
import { UserOptions, defaultOptions } from './options';

import { parse } from 'luaparse';

export function formatText(text: string, userOptions?: UserOptions) {
    const ast = parse(text, {
        comments: true,
        locations: true,
        ranges: true,
        luaVersion: '5.3'
    });

    // Change the chunk range to contain the whole source file so we can attach comments to it
    ast.range[0] = 0;
    ast.range[1] = text.length;

    const mergedOptions = Object.assign({}, defaultOptions, userOptions);

    const options = {
        ...mergedOptions,
        sourceText: text
    };

    attachComments(ast, options);

    const doc = buildDocFromAst(ast, options);
    const formattedText = printDocToString(doc, options);

    return formattedText;
}
