export interface Concat {
    type: 'concat';
    parts: Doc[];
}

export interface Line {
    type: 'line';
    soft: boolean;
    hard: boolean;
}

export interface Indent {
    type: 'indent';
    count: number;
    content: Doc;
}

export interface LineSuffix {
    type: 'lineSuffix';
    content: Doc;
}

export interface Group {
    type: 'group';
    content: Doc;
    willBreak: boolean;
}

export interface BreakParent {
    type: 'breakParent';
}

export type Doc = string | Concat | Line | Indent | LineSuffix | Group | BreakParent;

export function concat(parts: Doc[]): Doc {
    return {
        type: 'concat',
        parts
    };
}

export function join(separator: Doc, parts: Doc[]) {
    const result: Doc[] = [];
    parts.forEach((val, i) => {
        if (i > 0) {
            result.push(separator);
        }

        result.push(val);
    });

    return concat(result);
}

export const line: Line = {
    type: 'line',
    hard: false,
    soft: false
};

export const hardline: Line = {
    type: 'line',
    hard: true,
    soft: false
};

export const softline: Line = {
    type: 'line',
    hard: false,
    soft: true
};

export function indent(content: Doc, count: number = 4): Indent {
    return {
        type: 'indent',
        count,
        content
    };
}

export function lineSuffix(content: Doc): LineSuffix {
    return {
        type: 'lineSuffix',
        content
    };
}

export function group(content: Doc, willBreak: boolean = false): Group {
    return {
        type: 'group',
        content,
        willBreak
    };
}

export const breakParent: BreakParent = {
    type: 'breakParent'
};

export function isEmpty(instruction: Doc) {
    return typeof (instruction) === 'string' && instruction.length === 0;
}
