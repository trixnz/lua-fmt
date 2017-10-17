if (process.env.NODE_ENV === 'development') {
    require('source-map-support').install();
}

import { attachComments, injectShebang } from './comments';
import { buildDocFromAst } from './printer';
import { printDocToString } from './docPrinter';
import { UserOptions, defaultOptions } from './options';

import { parse } from 'luaparse';
import { createPatch } from 'diff';

export { UserOptions, defaultOptions, WriteMode } from './options';

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

    injectShebang(ast, options);
    attachComments(ast, options);

    const doc = buildDocFromAst(ast, options);
    const formattedText = printDocToString(doc, options);

    return formattedText;
}

export function producePatch(filename: string, originalDocument: string, formattedDocument: string) {
    return createPatch(filename, originalDocument, formattedDocument, 'original', 'formatted');
}
