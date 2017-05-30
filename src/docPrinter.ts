import { Doc, LineSuffix } from './docBuilder';
import { Options } from './options';

enum Mode {
    Flat,
    Break
};

interface State {
    options: Options;
    indentation: number;
    currentLineLength: number;
    mode: Mode;
    lineSuffixes: LineSuffix[];
    renderedText: string;
}

export function printDocToString(doc: Doc, options: Options) {
    const state = {
        options,
        indentation: 0,
        currentLineLength: 0,
        mode: Mode.Break,
        lineSuffixes: [],
        renderedText: ''
    };

    printDocToStringWithState(doc, state);

    return state.renderedText;
}

function canFitOnSingleLine(doc: Doc, state: State): boolean {
    function fits(text: string) {
        if (state.currentLineLength + text.length <= state.options.lineWidth) {
            state.currentLineLength += text.length;
            return true;
        }

        return false;
    }

    if (typeof (doc) === 'string') {
        return fits(doc);
    }

    switch (doc.type) {
        case 'concat':
            return doc.parts.every((part) => canFitOnSingleLine(part, state));

        case 'indent':
            state.indentation += doc.count;

            if (canFitOnSingleLine(doc.content, state)) {
                state.indentation -= doc.count;
                return true;
            }

            state.indentation -= doc.count;

            return false;

        case 'group':
            if (doc.willBreak) {
                state.mode = Mode.Break;
            }

            return canFitOnSingleLine(doc.content, state);

        case 'line':
            if (state.mode === Mode.Flat) {
                if (!doc.hard) {
                    if (!doc.soft) {
                        return fits(' ');
                    }

                    return true;
                }
            }

            state.currentLineLength = state.indentation;

            return true;

        case 'lineSuffix':
            return true;
    }

    return false;
}

function printDocToStringWithState(doc: Doc, state: State) {
    if (typeof (doc) === 'string') {
        state.renderedText += doc;
        state.currentLineLength += doc.length;
    } else {
        switch (doc.type) {
            case 'concat':
                for (const part of doc.parts) {
                    printDocToStringWithState(part, state);
                }
                break;

            case 'line':
                if (state.mode === Mode.Flat) {
                    if (!doc.hard) {
                        if (!doc.soft) {
                            state.renderedText += ' ';
                            state.currentLineLength += 1;
                        }

                        break;
                    }
                }

                if (state.lineSuffixes.length > 0) {
                    // Consume all of the line suffixes now so child calls to printDocToStringWithState don't take them
                    // into account when printing lines.
                    const suffixes = [...state.lineSuffixes];
                    state.lineSuffixes.length = 0;

                    for (const suffix of suffixes) {
                        printDocToStringWithState(suffix.content, state);
                    }
                }

                // Strip trailing whitespace.. this is probably rather inefficient as the string will progressively get
                // bigger and bigger..
                if (state.renderedText.length > 0) {
                    state.renderedText = state.renderedText.replace(
                        /[^\S\n]*$/,
                        ''
                    );
                }

                state.renderedText += '\n' + ' '.repeat(state.indentation);
                state.currentLineLength = state.indentation;
                break;

            case 'indent':
                {
                    state.indentation += doc.count;
                    printDocToStringWithState(doc.content, state);
                    state.indentation -= doc.count;
                    break;
                }

            case 'lineSuffix':
                state.lineSuffixes.push(doc);
                break;

            case 'group':
                const canFit = canFitOnSingleLine(doc, { ...state, mode: Mode.Flat });
                const oldMode = state.mode;

                if (!doc.willBreak && canFit) {
                    state.mode = Mode.Flat;
                } else {
                    state.mode = Mode.Break;
                }

                printDocToStringWithState(doc.content, state);
                state.mode = oldMode;

                break;
        }
    }
}
