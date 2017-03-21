import { Doc, Group } from './docBuilder';

type Callback = (instruction: Doc) => boolean;

function visitInstructions(insn: Doc, onEnter: Callback, onExit?: Callback) {
    let abort = false;

    const visitInstruction = (ins: Doc) => {
        if (onEnter(ins)) {
            abort = true;
            return;
        }

        if (abort) {
            return;
        }

        if (typeof ins === 'string') {
            return;
        }

        switch (ins.type) {
            case 'concat':
                ins.parts.forEach(visitInstruction);
                break;

            case 'indent':
            case 'group':
            case 'lineSuffix':
                visitInstruction(ins.content);
                break;
        }

        if (onExit) {
            onExit(ins);
        }
    };

    visitInstruction(insn);
}

function any(insn: Doc, callback: Callback) {
    let result = false;

    visitInstructions(insn, (instruction) => {
        if (callback(instruction)) {
            result = true;
            return true;
        }

        return false;
    });

    return result;
}

export function willBreak(insn: Doc) {
    return any(insn, (instruction) => {
        if (typeof instruction === 'string') {
            return false;
        }

        switch (instruction.type) {
            case 'line':
                if (instruction.hard) {
                    return true;
                }
                break;

            case 'group':
                if (instruction.willBreak) {
                    return true;
                }
        }

        return false;
    });
}

function breakParentGroup(stack: Group[]) {
    if (stack.length > 0) {
        stack[stack.length - 1].willBreak = true;
    }
}

export function propagateBreaks(insn: Doc) {
    const groupStack: Group[] = [];
    visitInstructions(insn,
        (instruction: Doc) => {
            if (typeof instruction === 'string') {
                return false;
            }

            switch (instruction.type) {
                case 'breakParent':
                    breakParentGroup(groupStack);
                    break;

                case 'group':
                    groupStack.push(instruction);
                    break;
            }

            return false;
        },
        (instruction: Doc) => {
            if (typeof instruction === 'string') {
                return false;
            }

            if (instruction.type === 'group') {
                const group = groupStack.pop();
                if (group && group.willBreak) {
                    breakParentGroup(groupStack);
                }
            }

            return false;
        });
}
