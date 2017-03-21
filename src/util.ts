import { Node } from 'luaparse';

export function locStart(node: Node) {
    return node.range[0];
}

export function locEnd(node: Node) {
    return node.range[1];
}

export function isNode(value: any) {
    if (!value || typeof (value.type) !== 'string') {
        return false;
    }

    switch (value.type) {
        case 'LabelStatement':
        case 'BreakStatement':
        case 'GotoStatement':
        case 'ReturnStatement':
        case 'IfStatement':
        case 'IfClause':
        case 'ElseifClause':
        case 'ElseClause':
        case 'WhileStatement':
        case 'DoStatement':
        case 'RepeatStatement':
        case 'LocalStatement':
        case 'AssignmentStatement':
        case 'CallStatement':
        case 'FunctionDeclaration':
        case 'ForNumericStatement':
        case 'ForGenericStatement':
        case 'Chunk':
        case 'Identifier':
        case 'BooleanLiteral':
        case 'NilLiteral':
        case 'NumericLiteral':
        case 'StringLiteral':
        case 'VarargLiteral':
        case 'TableKey':
        case 'TableKeyString':
        case 'TableValue':
        case 'TableConstructorExpression':
        case 'BinaryExpression':
        case 'LogicalExpression':
        case 'UnaryExpression':
        case 'MemberExpression':
        case 'IndexExpression':
        case 'CallExpression':
        case 'TableCallExpression':
        case 'StringCallExpression':
        case 'Comment':
            return true;

        default:
            return false;
    }
}

export interface SearchOptions {
    searchBackwards?: boolean;
};

export function skipOnce(text: string, idx: number, sequences: [string], searchOptions: SearchOptions = {}) {
    let skipCount = 0;
    sequences.forEach(seq => {
        const searchText = searchOptions.searchBackwards
            ? text.substring(idx - seq.length, idx)
            : text.substring(idx, idx + seq.length);

        if (searchText === seq) {
            skipCount = seq.length;
            return;
        }
    });

    return idx + (searchOptions.searchBackwards ? -skipCount : skipCount);
}

export function skipMany(text: string, idx: number, sequences: [string], searchOptions: SearchOptions = {}) {
    let oldIdx = null;

    while (oldIdx !== idx) {
        oldIdx = idx;
        idx = skipOnce(text, idx, sequences, searchOptions);
    }

    return idx;
}

export function skipNewLine(text: string, idx: number, searchOptions: SearchOptions = {}) {
    return skipOnce(text, idx, ['\n', '\r\n'], searchOptions);
}

export function skipSpaces(text: string, idx: number, searchOptions: SearchOptions = {}) {
    return skipMany(text, idx, [' ', '\t'], searchOptions);
}

export function skipToLineEnd(text: string, idx: number, searchOptions: SearchOptions = {}) {
    return skipMany(text, skipSpaces(text, idx), [';'], searchOptions);
}

export function hasNewLine(text: string, idx: number, searchOptions: SearchOptions = {}) {
    const endOfLineIdx = skipSpaces(text, idx, searchOptions);
    const nextLineIdx = skipNewLine(text, endOfLineIdx, searchOptions);

    return endOfLineIdx !== nextLineIdx;
}

export function isPreviousLineEmpty(text: string, idx: number) {
    idx = skipSpaces(text, idx, { searchBackwards: true });
    idx = skipNewLine(text, idx, { searchBackwards: true });

    idx = skipSpaces(text, idx, { searchBackwards: true });
    const previousLine = skipNewLine(text, idx, { searchBackwards: true });

    return idx !== previousLine;
}

export function skipTrailingComment(text: string, idx: number) {
    if (text.charAt(idx) === '-' && text.charAt(idx + 1) === '-') {
        idx += 2;

        while (idx >= 0 && idx < text.length) {
            if (text.charAt(idx) === '\n') {
                return idx;
            }

            if (text.charAt(idx) === '\r' && text.charAt(idx + 1) === '\n') {
                return idx;
            }

            idx++;
        }
    }

    return idx;
}

export function isNextLineEmpty(text: string, idx: number, searchOptions: SearchOptions = {
    searchBackwards: false
}) {
    idx = skipToLineEnd(text, idx, searchOptions);

    let oldIdx = null;
    while (idx !== oldIdx) {
        oldIdx = idx;
        idx = skipSpaces(text, idx, searchOptions);
    }

    idx = skipTrailingComment(text, idx);
    idx = skipNewLine(text, idx, searchOptions);

    return hasNewLine(text, idx);
}
