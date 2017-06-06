export type Quotemark = 'single' | 'double';

export interface Options {
    sourceText: string;
    lineWidth: number;
    quotemark: Quotemark;
}

export type UserOptions = Partial<Options>;

export const defaultOptions: Options = {
    sourceText: '',
    lineWidth: 120,
    quotemark: 'double'
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
