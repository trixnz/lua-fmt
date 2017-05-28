// ..kinda empty in here right now. *crickets*
export interface Options {
    sourceText: string;
    lineWidth: number;
    quotemark: 'single' | 'double';
}

export type UserOptions = Partial<Options>;

export const defaultOptions: Options = {
    sourceText: '',
    lineWidth: 120,
    quotemark: 'double'
};


/** Returns the quotation mark to use from the provided options. */
export function getStringQuotemark(options: Options) {
    return options.quotemark === 'single' ? '\'' : '"';
}

/**
 * Returns the alternative quotation mark to use from the provided options.
 *
 * i.e: If the configured quotemark is 'single', then this will return a double quote.
 */
export function getAlternativeStringQuotemark(options: Options) {
    return options.quotemark === 'single' ? '"' : '\'';
}
