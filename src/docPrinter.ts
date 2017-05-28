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
}

export function printDocToString(doc: Doc, options: Options) {
    return printDocToStringWithState(doc, {
        options,
        indentation: 0,
        currentLineLength: 0,
        mode: Mode.Break,
        lineSuffixes: []
    });
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
            const newState = {
                ...state,
                indentation: state.indentation + doc.count
            };
            if (canFitOnSingleLine(doc.content, newState)) {
                state.currentLineLength = newState.currentLineLength;
                return true;
            }

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
    let text = '';

    if (typeof (doc) === 'string') {
        text += doc;
        state.currentLineLength += doc.length;
    } else {
        switch (doc.type) {
            case 'concat':
                for (const part of doc.parts) {
                    const printedDoc = printDocToStringWithState(part, state);

                    text += printedDoc;
                    // state.currentLineLength += printedDoc.length;
                }
                break;

            case 'line':
                if (state.mode === Mode.Flat) {
                    if (!doc.hard) {
                        if (!doc.soft) {
                            text += ' ';
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
                        text += printDocToStringWithState(suffix.content, state);
                    }
                }

                text += '\n' + ' '.repeat(state.indentation);
                state.currentLineLength = state.indentation;
                break;

            case 'indent':
                {
                    const newState = {
                        ...state,
                        indentation: state.indentation + doc.count
                    };
                    text += printDocToStringWithState(doc.content, newState);
                    state.currentLineLength = newState.currentLineLength;
                    break;
                }

            case 'lineSuffix':
                state.lineSuffixes.push(doc);
                break;

            case 'group':
                let newState: State | null = null;
                const canFit = canFitOnSingleLine(doc, { ...state, mode: Mode.Flat });
                if (!doc.willBreak && canFit) {
                    newState = {
                        ...state,
                        mode: Mode.Flat
                    };
                    text += printDocToStringWithState(doc.content, newState);
                } else {
                    newState = {
                        ...state,
                        mode: Mode.Break
                    };
                    text += printDocToStringWithState(doc.content, newState);
                }

                state.currentLineLength = newState.currentLineLength;
                break;
        }
    }

    return text;
}
