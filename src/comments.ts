import { FastPath } from './fastPath';
import { Doc, concat, indent, join, hardline, lineSuffix, breakParent } from './docBuilder';
import { PrintFn } from './printer';
import { locStart, locEnd, isNextLineEmpty, hasNewLine, isPreviousLineEmpty } from './util';
import { Options } from './options';

import * as luaparse from 'luaparse';

enum CommentType {
    Leading,
    Trailing,
    Dangling,
    DanglingStatement
}

function getChildrenOfNode(node: luaparse.Node): luaparse.Node[] {
    const keys = Object.keys(node);

    const children: luaparse.Node[] = [];
    function addChild(n: luaparse.Node) {
        if (n && typeof (n.type) === 'string' && n.type !== 'Comment') {
            let idx;
            for (idx = children.length - 1; idx >= 0; --idx) {
                if (locStart(children[idx]) <= locStart(n) &&
                    locEnd(children[idx]) <= locEnd(node)) {
                    break;
                }
            }

            children.splice(idx + 1, 0, n);
        }
    };

    for (const key of keys) {
        const val = node[key];
        if (Array.isArray(val)) {
            val.forEach(addChild);
        } else if (val) {
            addChild(val);
        }
    }

    return children;
}

export function attachComments(ast: luaparse.Chunk, options: Options) {
    for (const comment of ast.comments) {
        decorateComment(ast, comment);

        const precedingNode = (comment as any).precedingNode as luaparse.Node;
        const enclosingNode = (comment as any).enclosingNode as luaparse.Node;
        const followingNode = (comment as any).followingNode as luaparse.Node;

        if (hasNewLine(options.sourceText, locStart(comment), { searchBackwards: true })) {
            if (
                handleStatementsWithNoBodyComments(enclosingNode, comment) ||
                handleFunctionBodyComments(precedingNode, enclosingNode, comment) ||
                handleIfStatementsWithNoBodyComments(precedingNode, enclosingNode, followingNode, comment)
            ) {
                // Handled
            }
            else if (followingNode) {
                addLeadingComment(followingNode, comment);
            } else if (precedingNode) {
                addTrailingComment(precedingNode, comment);
            }
            else if (enclosingNode) {
                addDanglingComment(enclosingNode, comment);
            }
            else {
                addDanglingComment(ast, comment);
            }
        } else {
            if (
                handleExpressionBeginComments(precedingNode, enclosingNode, comment) ||
                handleDanglingIfStatementsWithNoBodies(precedingNode, enclosingNode, comment)
            ) {
                // Handled
            }
            else if (precedingNode) {
                addTrailingComment(precedingNode, comment);
            }
            else if (followingNode) {
                addLeadingComment(followingNode, comment);
            }
            else if (enclosingNode) {
                addDanglingComment(enclosingNode, comment);
            }
            else {
                addDanglingComment(ast, comment);
            }
        }
    }
}

export function injectShebang(ast: luaparse.Chunk, options: Options) {
    if (!options.sourceText.startsWith('#!')) {
        return;
    }

    const endLine = options.sourceText.indexOf('\n');
    const raw = options.sourceText.slice(0, endLine);
    const shebang = options.sourceText.slice(2, endLine);

    ast.comments.push({
        type: 'Comment',
        loc: {
            start: {
                line: 1,
                column: 0
            },
            end: {
                line: 1,
                column: endLine
            }
        },
        range: [0, endLine],
        raw,
        value: shebang
    });
}

export function printDanglingComments(path: FastPath, sameIndent: boolean = false): Doc {
    const node = path.getValue();

    if (!node || !node.attachedComments) {
        return '';
    }

    const parts: Doc[] = [];
    path.forEach((commentPath) => {
        const comment = commentPath.getValue();

        if (comment.commentType === CommentType.Dangling) {
            parts.push(comment.raw);
        }
    }, 'attachedComments');

    if (parts.length === 0) {
        return '';
    }

    if (sameIndent) {
        return join(hardline, parts);
    }

    return indent(concat([hardline, join(hardline, parts)]));
}

// Prints comments that were attached to the end of a statement that leads to a block. Since luaparse doesn't give us
// AST nodes for blocks, we need to catch these cases and print them manually.
export function printDanglingStatementComments(path: FastPath): Doc {
    const node = path.getValue();

    if (!node || !node.attachedComments) {
        return '';
    }

    const parts: Doc[] = [];
    path.forEach((commentPath) => {
        const comment = commentPath.getValue();

        if (comment.commentType === CommentType.DanglingStatement) {
            parts.push(' ');
            parts.push(comment.raw);
        }
    }, 'attachedComments');

    if (parts.length === 0) {
        return '';
    }

    return concat(parts);
}

function printLeadingComment(path: FastPath, options: Options) {
    const comment = path.getValue() as luaparse.Comment;
    const isBlockComment = comment.raw.startsWith('--[[');

    if (isBlockComment) {
        return concat([
            comment.raw,
            hasNewLine(options.sourceText, locEnd(comment)) ? hardline : ' ']
        );
    }

    const parts = [];
    parts.push(comment.raw);
    parts.push(hardline);

    // If the leading comment contains a trailing newline, make sure we preserve it.
    if (isNextLineEmpty(options.sourceText, locEnd(comment))) {
        parts.push(hardline);
    }

    return concat(parts);
}

function printTrailingComment(path: FastPath, options: Options) {
    const comment = path.getValue() as luaparse.Comment;

    if (hasNewLine(options.sourceText, locStart(comment), { searchBackwards: true })) {
        const previousLineEmpty = isPreviousLineEmpty(options.sourceText, locStart(comment));

        return concat([hardline, previousLineEmpty ? hardline : '', comment.raw]);
    }

    if (comment.raw.startsWith('--[[')) {
        return concat([' ', comment.raw]);
    }

    const parts = [];

    // Preserve newline before comment
    if (isNextLineEmpty(options.sourceText, locStart(comment), { searchBackwards: true })) {
        parts.push(hardline);
    }

    parts.push(' ');
    parts.push(comment.raw);
    parts.push(breakParent);

    return lineSuffix(concat(parts));
}

export function printComments(path: FastPath, options: Options, print: PrintFn) {
    const node = path.getValue();
    const printed = print(path);
    const comments = (node as any).attachedComments;
    if (!comments || comments.length === 0) {
        return printed;
    }

    const leadingParts: Doc[] = [];
    const trailingParts: Doc[] = [printed];

    path.forEach((commentPath) => {
        const comment = commentPath.getValue();
        const commentType = comment.commentType as CommentType;

        switch (commentType) {
            case CommentType.Leading:
                leadingParts.push(printLeadingComment(path, options));
                break;

            case CommentType.Trailing:
                trailingParts.push(printTrailingComment(path, options));
                break;
        }
    }, 'attachedComments');

    return concat(leadingParts.concat(trailingParts));
}

function decorateComment(node: luaparse.Node, comment: luaparse.Comment) {
    const childNodes = getChildrenOfNode(node);

    let precedingNode: luaparse.Node | null = null;
    let followingNode: luaparse.Node | null = null;

    let left = 0;
    let right = childNodes.length;

    while (left < right) {
        const middle = Math.floor((left + right) / 2);
        const childNode = childNodes[middle];

        // Does the comment completely fall within the range of this node?
        if (
            locStart(childNode) - locStart(comment) <= 0 &&
            locEnd(comment) - locEnd(childNode) <= 0
        ) {
            (comment as any).enclosingNode = childNode;

            decorateComment(childNode, comment);
            return;
        }

        // Does this node precede the comment?
        if (locEnd(childNode) - locStart(comment) <= 0) {
            precedingNode = childNode;
            left = middle + 1;
            continue;
        }

        // Does this node follow the comment?
        if (locEnd(comment) - locStart(childNode) <= 0) {
            followingNode = childNode;
            right = middle;
            continue;
        }
    }

    if (precedingNode) {
        (comment as any).precedingNode = precedingNode;
    }

    if (followingNode) {
        (comment as any).followingNode = followingNode;
    }
}

function addComment(node: luaparse.Node, comment: luaparse.Comment) {
    const comments = (node as any).attachedComments || ((node as any).attachedComments = []);
    comments.push(comment);
}

function addLeadingComment(node: luaparse.Node, comment: luaparse.Comment) {
    (comment as any).commentType = CommentType.Leading;
    addComment(node, comment);
}

function addDanglingComment(node: luaparse.Node, comment: luaparse.Comment) {
    (comment as any).commentType = CommentType.Dangling;
    addComment(node, comment);
}

function addDanglingStatementComment(node: luaparse.Node, comment: luaparse.Comment) {
    (comment as any).commentType = CommentType.DanglingStatement;
    addComment(node, comment);
}

function addTrailingComment(node: luaparse.Node, comment: luaparse.Comment) {
    (comment as any).commentType = CommentType.Trailing;
    addComment(node, comment);
}

function handleStatementsWithNoBodyComments(enclosingNode: luaparse.Node, comment: luaparse.Comment) {
    if (!enclosingNode || (enclosingNode as any).body == null) {
        return false;
    }

    // Node has a comment in the body but no statements to attach to.. attach it as a dangling comment instead.
    if ((enclosingNode as any).body.length === 0) {
        addDanglingComment(enclosingNode, comment);
        return true;
    }

    return false;
}

// Handle comments in functions with no bodies. The nearest node will be either the last function argument or the
// function name itself. We need to relocate these to dangling comments on the function itself so it can print them
// itself.
function handleFunctionBodyComments(precedingNode: luaparse.Node,
    enclosingNode: luaparse.Node, comment: luaparse.Comment) {
    if (!enclosingNode || enclosingNode.type !== 'FunctionDeclaration' || enclosingNode.body.length > 0) {
        return false;
    }

    if (enclosingNode.parameters.length > 0 &&
        enclosingNode.parameters[enclosingNode.parameters.length - 1] === precedingNode) {
        addDanglingComment(enclosingNode, comment);
        return true;
    }

    if (precedingNode && precedingNode.type === 'Identifier') {
        addDanglingComment(enclosingNode, comment);
        return true;
    }

    return false;
}

// Handle comments in IfStatement clauses where the clause has no body. We need to relocate them to the appropriate
// clause as a dangling comment.
function handleIfStatementsWithNoBodyComments(precedingNode: luaparse.Node,
    enclosingNode: luaparse.Node, followingNode: luaparse.Node, comment: luaparse.Comment) {
    if (!enclosingNode || enclosingNode.type !== 'IfStatement') {
        return false;
    }

    if (followingNode && (followingNode.type === 'ElseifClause' || followingNode.type === 'ElseClause')) {
        addDanglingComment(precedingNode, comment);
        return true;
    }

    if (precedingNode && precedingNode.type === 'ElseClause') {
        addDanglingComment(precedingNode, comment);
        return true;
    }

    return false;
}

// Handle trailing comments on expressions whose AST range includes the body. We need to relocate them to dangling
// comments so they can print them when appropriate.
function handleExpressionBeginComments(precedingNode: luaparse.Node,
    enclosingNode: luaparse.Node, comment: luaparse.Comment) {
    if (comment.raw.startsWith('--[[')) {
        return false;
    }

    if (!enclosingNode) {
        return false;
    }

    switch (enclosingNode.type) {
        case 'WhileStatement':
            if (precedingNode === enclosingNode.condition) {
                addDanglingStatementComment(enclosingNode, comment);
                return true;
            }
            break;

        case 'DoStatement':
        case 'RepeatStatement':
            if (precedingNode == null) {
                addDanglingStatementComment(enclosingNode, comment);
                return true;
            }
            break;

        case 'FunctionDeclaration':
            if (
                (enclosingNode.parameters.length &&
                    precedingNode === enclosingNode.parameters[enclosingNode.parameters.length - 1]) ||
                (precedingNode === enclosingNode.identifier)
            ) {
                addDanglingStatementComment(enclosingNode, comment);
                return true;
            }
            break;

        case 'ForNumericStatement':
            if (precedingNode === enclosingNode.end || precedingNode === enclosingNode.step) {
                addDanglingStatementComment(enclosingNode, comment);
                return true;
            }
            break;

        case 'ForGenericStatement':
            if (precedingNode === enclosingNode.iterators[enclosingNode.iterators.length - 1]) {
                addDanglingStatementComment(enclosingNode, comment);
                return true;
            }
            break;

        case 'IfClause':
        case 'ElseifClause':
            // If the comment would be assigned to the condition, but exists after it, then attach it to the clause.
            if (precedingNode === enclosingNode.condition &&
                comment.loc.start.column > precedingNode.loc.start.column) {
                addDanglingStatementComment(enclosingNode, comment);
                return true;
            }
            break;

        case 'ElseClause':
            // If the comment has no preceding node but is enclosed by the ElseClause, then it must be a trailing
            // statement comment
            if (precedingNode == null) {
                addDanglingStatementComment(enclosingNode, comment);
                return true;
            }
            break;
    }

    return false;
}

// Handle dangling comments on clauses within IfStatements that contain empty bodies. The logical place to put them
// would otherwise be trailing comments of the clause itself, which is not correct.
function handleDanglingIfStatementsWithNoBodies(precedingNode: luaparse.Node,
    enclosingNode: luaparse.Node, comment: luaparse.Comment) {
    if (!precedingNode || !enclosingNode) {
        return false;
    }

    if (enclosingNode.type !== 'IfStatement') {
        return false;
    }

    switch (precedingNode.type) {
        case 'IfClause':
        case 'ElseifClause':
        case 'ElseClause':
            if (precedingNode.body.length === 0) {
                addDanglingStatementComment(precedingNode, comment);
                return true;
            }
            break;
    }

    return false;
}
