export type Quotemark = 'single' | 'double';
export enum WriteMode {
    StdOut = 'stdout',
    Replace = 'replace',
    Diff = 'diff'
}

export interface Options {
    sourceText: string;
    lineWidth: number;
    indentCount: number;
    useTabs: boolean;
    linebreakMultipleAssignments: boolean;
    quotemark: Quotemark;
    writeMode: WriteMode;
    listDifferent: boolean;
}

export type UserOptions = Partial<Options>;

export const defaultOptions: Options = {
    sourceText: '',
    lineWidth: 120,
    indentCount: 4,
    useTabs: false,
    linebreakMultipleAssignments: false,
    quotemark: 'double',
    writeMode: WriteMode.StdOut,
    listDifferent: false
};

/** Returns the quotation mark to use from the provided option. */
export function getStringQuotemark(quotemark: Quotemark) {
    return quotemark === 'single' ? '\'' : '"';
}

/**
 * Returns the alternative quotation mark to use from the provided option.
 *
 * i.e: If the quotemark is 'single', then this will return a double quote.
 */
export function getAlternativeStringQuotemark(quotemark: Quotemark) {
    return quotemark === 'single' ? '"' : '\'';
}
