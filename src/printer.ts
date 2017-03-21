import { FastPath } from './fastPath';
import { Doc, concat, join, indent, hardline, softline, group, line } from './docBuilder';
import { willBreak, propagateBreaks } from './docUtils';

import { printComments, printDanglingComments, printDanglingStatementComments } from './comments';
import { locEnd, isNextLineEmpty } from './util';
import { Options } from './options';

import * as luaparse from 'luaparse';

export type PrintFn = (path: FastPath) => Doc;

// Prints a sequence of statements with a newline separating them..
// ex:
//  local a = 1
//  local b = 2
function printStatementSequence(path: FastPath, options: Options, print: PrintFn): Doc {
    const printed: Doc[] = [];

    path.forEach((statementPath) => {
        const parts = [print(statementPath)];

        if (isNextLineEmpty(options.sourceText, locEnd(statementPath.getValue())) && !isLastStatement(path)) {
            parts.push(hardline);
        }

        printed.push(concat(parts));
    });

    return join(hardline, printed);
}

// Same as printStatementSequence, however the statements are indented
function printIndentedStatementList(path: FastPath, options: Options, print: PrintFn, field: string): Doc {
    const printedBody = path.call((bodyPath) => {
        return printStatementSequence(bodyPath, options, print);
    }, field);

    return indent(concat([hardline, printedBody]));
}

// Prints a comment present at the end of a statement leading to a block, which would otherwise fall into the body of
// the statement. Doing so might remove contextual information in the comment.
function printDanglingStatementComment(path: FastPath) {
    const comments = (path.getValue() as any).attachedComments;
    if (!comments) { return ''; }

    return concat([printDanglingStatementComments(path), printDanglingComments(path)]);
}

function isLastStatement(path: FastPath) {
    const parent = path.getParent();
    const node = path.getValue();
    const body = parent.body;

    return body && body[body.length - 1] === node;
}

function printNodeNoParens(path: FastPath, options: Options, print: PrintFn) {
    const value = path.getValue();

    if (!value) {
        return '';
    }

    const parts: Doc[] = [];

    const node = value as luaparse.Node;

    switch (node.type) {
        case 'Chunk':
            parts.push(
                path.call((bodyPath) => {
                    return printStatementSequence(bodyPath, options, print);
                }, 'body'));

            parts.push(printDanglingComments(path, true));

            if (node.body.length || (node as any).attachedComments) {
                parts.push(hardline);
            }

            return concat(parts);

        // Statements
        case 'LabelStatement':
            return concat(['::', path.call(print, 'label'), '::']);

        case 'GotoStatement':
            return concat(['goto ', path.call(print, 'label')]);

        case 'BreakStatement':
            return 'break';

        case 'ReturnStatement':
            return concat(['return ', join(', ', path.map(print, 'arguments'))]);

        case 'WhileStatement':
            parts.push('while ');
            parts.push(path.call(print, 'condition'));
            parts.push(' do');

            parts.push(printDanglingStatementComment(path));

            if (node.body.length) {
                parts.push(printIndentedStatementList(path, options, print, 'body'));
            }

            parts.push(concat([hardline, 'end']));

            return concat(parts);

        case 'DoStatement':
            parts.push('do');

            parts.push(printDanglingStatementComment(path));

            if (node.body.length) {
                parts.push(printIndentedStatementList(path, options, print, 'body'));
            }

            parts.push(concat([hardline, 'end']));

            return concat(parts);

        case 'RepeatStatement':
            parts.push('repeat');

            parts.push(printDanglingStatementComment(path));

            if (node.body.length) {
                parts.push(printIndentedStatementList(path, options, print, 'body'));
            }

            parts.push(concat([hardline, 'until ']));
            parts.push(path.call(print, 'condition'));

            return concat(parts);

        case 'LocalStatement':
        case 'AssignmentStatement':
            if (node.type === 'LocalStatement') {
                parts.push('local ');
            }

            parts.push(join(', ', path.map(print, 'variables')));

            if (node.init.length) {
                parts.push(' = ');

                parts.push(join(', ', path.map(print, 'init')));
            }

            return concat(parts);

        case 'CallStatement':
            return path.call(print, 'expression');

        case 'FunctionDeclaration':
            if (node.isLocal) {
                parts.push('local ');
            }

            parts.push('function');

            if (node.identifier) {
                parts.push(' ', path.call(print, 'identifier'));
            }

            parts.push(
                concat([
                    '(',
                    join(', ', path.map(print, 'parameters')),
                    ')'])
            );

            parts.push(printDanglingStatementComment(path));

            if (node.body.length) {
                parts.push(printIndentedStatementList(path, options, print, 'body'));
            }

            parts.push(hardline, 'end');

            return concat(parts);

        case 'ForNumericStatement':
            parts.push('for ');
            parts.push(path.call(print, 'variable'));
            parts.push(' = ');
            parts.push(path.call(print, 'start'));
            parts.push(', ');
            parts.push(path.call(print, 'end'));

            if (node.step) {
                parts.push(', ');
                parts.push(path.call(print, 'step'));
            }

            parts.push(' do');

            parts.push(printDanglingStatementComment(path));

            if (node.body.length) {
                parts.push(printIndentedStatementList(path, options, print, 'body'));
            }

            parts.push(concat([hardline, 'end']));

            return concat(parts);

        case 'ForGenericStatement':
            parts.push('for ');
            parts.push(join(', ', path.map(print, 'variables')));
            parts.push(' in ');
            parts.push(join(', ', path.map(print, 'iterators')));
            parts.push(' do');

            parts.push(printDanglingStatementComment(path));

            if (node.body.length) {
                parts.push(printIndentedStatementList(path, options, print, 'body'));
            }

            parts.push(concat([hardline, 'end']));

            return concat(parts);

        case 'IfStatement':
            const printed: Doc[] = [];
            path.forEach((statementPath) => {
                printed.push(print(statementPath));
            }, 'clauses');

            parts.push(join(hardline, printed));
            parts.push(concat([hardline, 'end']));

            return concat(parts);

        // Clauses
        case 'IfClause':
            parts.push(concat([
                'if ', path.call(print, 'condition'), ' then'
            ]));

            parts.push(printDanglingStatementComment(path));

            if (node.body.length) {
                parts.push(printIndentedStatementList(path, options, print, 'body'));
            }

            return concat(parts);

        case 'ElseifClause':
            parts.push(concat([
                'elseif ', path.call(print, 'condition'), ' then'
            ]));

            parts.push(printDanglingStatementComment(path));

            if (node.body.length) {
                parts.push(printIndentedStatementList(path, options, print, 'body'));
            }

            return concat(parts);

        case 'ElseClause':
            parts.push('else');

            parts.push(printDanglingStatementComment(path));

            if (node.body.length) {
                parts.push(printIndentedStatementList(path, options, print, 'body'));
            }

            return concat(parts);

        // Literals
        case 'BooleanLiteral':
            return node.raw;

        case 'NilLiteral':
            return 'nil';

        case 'NumericLiteral':
            return node.raw;

        case 'StringLiteral':
            // TODO: StringLiterals should be normalized to a single quote character. This could get messy as Lua
            // supports an abnormally high number of string formats..
            return node.raw;

        case 'VarargLiteral':
            return '...';

        case 'Identifier':
            return node.name;

        // Expressions
        case 'BinaryExpression':
        case 'LogicalExpression':
            return concat([
                path.call(print, 'left'),
                ' ', node.operator, ' ',
                path.call(print, 'right')
            ]);

        case 'UnaryExpression':
            parts.push(node.operator);

            if (node.operator === 'not') {
                parts.push(' ');
            }

            parts.push(path.call(print, 'argument'));

            return concat(parts);

        case 'MemberExpression':
            return concat([
                path.call(print, 'base'),
                node.indexer,
                path.call(print, 'identifier')
            ]);

        case 'IndexExpression':
            return concat([
                path.call(print, 'base'),
                '[', path.call(print, 'index'), ']'
            ]);

        case 'CallExpression':
            const printedCallExpressionArgs = path.map(print, 'arguments');

            return concat([
                path.call(print, 'base'),
                group(
                    concat([
                        '(',
                        indent(
                            concat([softline, join(concat([',', line]), printedCallExpressionArgs)])
                        ),
                        softline,
                        ')'
                    ]),
                    printedCallExpressionArgs.some(willBreak)
                )
            ]);

        case 'TableCallExpression':
            parts.push(path.call(print, 'base'));
            parts.push(' ');
            parts.push(path.call(print, 'arguments'));

            return concat(parts);

        case 'StringCallExpression':
            parts.push(path.call(print, 'base'));
            parts.push(' ');
            parts.push(path.call(print, 'argument'));

            return concat(parts);

        case 'TableConstructorExpression':
            if (node.fields.length === 0) {
                return '{}';
            }

            const fields: Doc[] = [];
            let separatorParts: Doc[] = [];

            path.forEach(childPath => {
                fields.push(concat(separatorParts));
                fields.push(print(childPath));

                separatorParts = [',', line];
            }, 'fields');

            return group(
                concat([
                    '{',
                    indent(
                        concat([softline, concat(fields)])
                    ),
                    softline,
                    '}'
                ])
            );

        case 'TableKeyString':
            return concat([
                path.call(print, 'key'),
                ' = ',
                path.call(print, 'value')
            ]);

        case 'TableKey':
            return concat([
                '[', path.call(print, 'key'), ']',
                ' = ',
                path.call(print, 'value')
            ]);

        case 'TableValue':
            return path.call(print, 'value');
    }

    throw new Error('Unhandled AST node: ' + node.type);
}

function printNode(path: FastPath, options: Options, print: PrintFn) {
    const printed = printNodeNoParens(path, options, print);

    const parts = [];
    const needsParens = path.needsParens();
    if (needsParens) {
        parts.push('(');
    }

    parts.push(printed);

    if (needsParens) {
        parts.push(')');
    }

    return concat(parts);
}

export function buildDocFromAst(ast: luaparse.Chunk, options: Options) {
    const printNodeWithComments = (path: FastPath): Doc => {
        return printComments(path, options, p => printNode(p, options, printNodeWithComments));
    };

    const doc = printNodeWithComments(new FastPath(ast));
    propagateBreaks(doc);

    return doc;
}
