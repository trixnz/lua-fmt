import { Doc } from './docBuilder';
import { isNode } from './util';

import * as luaparse from 'luaparse';

export type Callback = (path: FastPath) => Doc;
export type CallbackForEach = (path: FastPath, index: number) => void;
export type CallbackMap = (path: FastPath, index: number) => Doc;

export class FastPath {
    private stack: any[];

    public constructor(ast: luaparse.Chunk) {
        this.stack = [ast];
    }

    public getValue() {
        return this.stack[this.stack.length - 1];
    }

    public getNodeAtDepth(depth: number) {
        for (let i = this.stack.length - 1; i >= 0; i -= 2) {
            const value = this.stack[i];

            if (isNode(value) && --depth < 0) {
                return value;
            }
        }

        return null;
    }

    public getParent(depth: number = 0) {
        return this.getNodeAtDepth(depth + 1);
    }

    public call(callback: Callback, field: string) {
        const node = this.getValue();
        const origLength = this.stack.length;

        this.stack.push(field, node[field]);
        const result = callback(this);
        this.stack.length = origLength;

        return result;
    }

    public forEach(callback: CallbackForEach, field: string | null = null) {
        let value = this.getValue();

        const origLength = this.stack.length;

        if (field) {
            value = value[field];
            this.stack.push(value);
        }

        for (let i = 0; i < value.length; ++i) {
            this.stack.push(i, value[i]);
            callback(this, i);
            this.stack.length -= 2;
        }

        this.stack.length = origLength;
    }

    public map(callback: (path: FastPath, index: number) => Doc, field: string) {
        const node = this.getValue()[field];

        if (!Array.isArray(node)) {
            return [];
        }

        const result: Doc[] = [];
        const origLength = this.stack.length;

        this.stack.push(node);

        node.forEach((val, i) => {
            this.stack.push(i, val);
            result.push(callback(this, i));
            this.stack.length -= 2;
        });

        this.stack.length = origLength;

        return result;
    }

    public needsParens() {
        const parent = this.getParent() as luaparse.Node;
        const value = this.getValue() as luaparse.Node;

        let inParens = false;
        switch (value.type) {
            case 'FunctionDeclaration':
            case 'Chunk':
            case 'Identifier':
            case 'BooleanLiteral':
            case 'NilLiteral':
            case 'NumericLiteral':
            case 'StringLiteral':
            case 'VarargLiteral':
            case 'TableConstructorExpression':
            case 'BinaryExpression':
            case 'LogicalExpression':
            case 'UnaryExpression':
            case 'MemberExpression':
            case 'IndexExpression':
            case 'CallExpression':
            case 'TableCallExpression':
            case 'StringCallExpression':
                inParens = value.inParens || false;
        }

        if (parent) {
            /*
                If this UnaryExpression is nested below another UnaryExpression, wrap the nested expression in
                parens. This not only improves readability of complex expressions, but also prevents `- -1` from
                becoming `--1`, which would result in a comment.
            */
            if (value.type === 'UnaryExpression' && parent.type === 'UnaryExpression') {
                inParens = true;
            }
        }

        return inParens;
    }
}
