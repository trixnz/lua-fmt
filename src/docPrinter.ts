import { Doc, LineSuffix } from './docBuilder';

enum Mode {
    Flat,
    Break
};

interface State {
    indentation: number;
    mode: Mode;
    lineSuffixes: LineSuffix[];
}

export function printDocToString(doc: Doc) {
    return printDocToStringWithState(doc, {
        indentation: 0,
        mode: Mode.Break,
        lineSuffixes: []
    });
}

function printDocToStringWithState(doc: Doc, state: State) {
    let text = '';

    if (typeof (doc) === 'string') {
        text += doc;
    } else {
        switch (doc.type) {
            case 'concat':
                for (const part of doc.parts) {
                    text += printDocToStringWithState(part, state);
                }
                break;

            case 'line':
                if (state.mode === Mode.Flat) {
                    if (!doc.hard) {
                        if (!doc.soft) {
                            text += ' ';
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

                break;

            case 'indent':
                text += printDocToStringWithState(doc.content, {
                    ...state,
                    indentation: state.indentation + doc.count
                });
                break;

            case 'lineSuffix':
                state.lineSuffixes.push(doc);
                break;

            case 'group':
                if (!doc.willBreak) {
                    text += printDocToStringWithState(doc.content, {
                        ...state,
                        mode: Mode.Flat
                    });
                } else {
                    text += printDocToStringWithState(doc.content, {
                        ...state,
                        mode: Mode.Break
                    });
                }
                break;
        }
    }

    return text;
}
