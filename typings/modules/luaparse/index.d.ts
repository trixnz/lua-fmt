/* luaparse by: https://github.com/oxyc */
/* typing definition by: https://github.com/hydroper */
declare module 'luaparse' {
    interface NodeAdditional {
        type: string;
        loc: MarkerLocations;
        range: [number, number];
    }

    interface ExpAdditional extends NodeAdditional {
        inParens?: boolean;
    }

    export type Expression = CallExpression | StringCallExpression | TableCallExpression |
        FunctionDeclaration | Identifier | IndexExpression | MemberExpression |
        TableConstructorExpression | BooleanLiteral | NumericLiteral | StringLiteral |
        VarargLiteral | NilLiteral | BinaryExpression | LogicalExpression | UnaryExpression;

    export type Statement = LabelStatement | BreakStatement | GotoStatement |
        ReturnStatement | IfStatement | IfClause | ElseifClause | ElseClause | WhileStatement |
        DoStatement | RepeatStatement | LocalStatement | AssignmentStatement | CallStatement |
        FunctionDeclaration | ForNumericStatement | ForGenericStatement;

    type Node = Chunk | Expression | Statement | TableKey | TableKeyString | TableValue | Comment;

    export interface LabelStatement extends NodeAdditional {
        readonly type: "LabelStatement";
        readonly label: Identifier;
    }

    export interface BreakStatement extends NodeAdditional {
        readonly type: "BreakStatement";
    }

    export interface GotoStatement extends NodeAdditional {
        readonly type: "GotoStatement";
        readonly label: Identifier;
    }
    export interface ReturnStatement extends NodeAdditional {
        readonly type: "ReturnStatement";
        readonly arguments: Expression[];
    }
    export interface IfStatement extends NodeAdditional {
        readonly type: "IfStatement";
        readonly clauses: (IfClause | ElseifClause | ElseClause)[];
    }
    export interface IfClause extends NodeAdditional {
        readonly type: "IfClause";
        readonly condition: Expression;
        readonly body: Statement[];
    }
    export interface ElseifClause extends NodeAdditional {
        readonly type: "ElseifClause";
        readonly condition: Expression;
        readonly body: Statement[];
    }
    export interface ElseClause extends NodeAdditional {
        readonly type: "ElseClause";
        readonly body: Statement[];
    }
    export interface WhileStatement extends NodeAdditional {
        readonly type: "WhileStatement";
        readonly condition: Expression;
        readonly body: Statement[];
    }
    export interface DoStatement extends NodeAdditional {
        readonly type: "DoStatement";
        readonly body: Statement[];
    }
    export interface RepeatStatement extends NodeAdditional {
        readonly type: "RepeatStatement";
        readonly condition: Expression;
        readonly body: Statement[];
    }
    export interface LocalStatement extends NodeAdditional {
        readonly type: "LocalStatement";
        readonly variables: Identifier[];
        readonly init: (Expression | null)[];
    }
    export interface AssignmentStatement extends NodeAdditional {
        readonly type: "AssignmentStatement";
        readonly variables: (Identifier | IndexExpression | MemberExpression)[];
        readonly init: (Expression | null)[];
    }
    export interface CallStatement extends NodeAdditional {
        readonly type: "CallStatement";
        readonly expression: Expression;
    }
    export interface FunctionDeclaration extends ExpAdditional {
        readonly type: "FunctionDeclaration";
        readonly identifier: Identifier | MemberExpression | null;
        readonly isLocal: boolean;
        readonly parameters: (Identifier | VarargLiteral)[];
        readonly body: Statement[];
    }
    export interface ForNumericStatement extends NodeAdditional {
        readonly type: "ForNumericStatement";
        readonly variable: Identifier;
        readonly start: Expression;
        readonly end: Expression;
        readonly step: Expression;
        readonly body: Statement[];
    }
    export interface ForGenericStatement extends NodeAdditional {
        readonly type: "ForGenericStatement";
        readonly variables: Identifier[];
        readonly iterators: Expression[];
        readonly body: Statement[];
    }
    export interface Chunk extends ExpAdditional {
        readonly type: "Chunk";
        readonly body: Statement[];
        readonly comments: Comment[];
        readonly globals?: Expression[];
    }
    export interface Identifier extends ExpAdditional {
        readonly type: "Identifier";
        readonly name: string;
        readonly isLocal?: boolean
    }
    export interface BooleanLiteral extends ExpAdditional {
        readonly type: "BooleanLiteral";
        readonly raw: string;
        readonly value: boolean;
    }
    export interface NilLiteral extends ExpAdditional {
        readonly type: "NilLiteral";
        readonly raw: string;
        readonly value: null;
    }
    export interface NumericLiteral extends ExpAdditional {
        readonly type: "NumericLiteral";
        readonly raw: string;
        readonly value: number;
    }
    export interface StringLiteral extends ExpAdditional {
        readonly type: "StringLiteral";
        readonly raw: string;
        readonly value: string;
    }
    export interface VarargLiteral extends ExpAdditional {
        readonly type: "VarargLiteral";
        readonly raw: string;
        readonly value: string;
    }
    export interface TableKey extends NodeAdditional {
        readonly type: "TableKey";
        readonly key: Expression;
        readonly value: Expression;
    }
    export interface TableKeyString extends NodeAdditional {
        readonly type: "TableKeyString";
        readonly key: Identifier;
        readonly value: Expression;
    }
    export interface TableValue extends NodeAdditional {
        readonly type: "TableValue";
        readonly value: Expression;
    }
    export interface TableConstructorExpression extends ExpAdditional {
        readonly type: "TableConstructorExpression";
        readonly fields: (TableKey | TableKeyString | TableValue)[];
    }
    export interface BinaryExpression extends ExpAdditional {
        readonly type: "BinaryExpression";
        readonly operator: string;
        readonly left: Expression;
        readonly right: Expression;
    }
    export interface LogicalExpression extends ExpAdditional {
        readonly type: "LogicalExpression";
        readonly operator: string;
        readonly left: Expression;
        readonly right: Expression;
    }
    export interface UnaryExpression extends ExpAdditional {
        readonly type: "UnaryExpression";
        readonly operator: string;
        readonly argument: Expression;
    }
    export interface MemberExpression extends ExpAdditional {
        readonly type: "MemberExpression";
        readonly indexer: string;
        readonly identifier: Identifier;
        readonly base: Expression;
    }
    export interface IndexExpression extends ExpAdditional {
        readonly type: "IndexExpression";
        readonly base: Expression;
        readonly index: Expression;
    }
    export interface CallExpression extends ExpAdditional {
        readonly type: "CallExpression";
        readonly base: Expression;
        readonly arguments: Expression[];
    }
    export interface TableCallExpression extends ExpAdditional {
        readonly type: "TableCallExpression";
        readonly base: Expression;
        readonly arguments: TableCallExpression;
    }
    export interface StringCallExpression extends ExpAdditional {
        readonly type: "StringCallExpression";
        readonly base: Expression;
        readonly argument: StringLiteral;
    }
    export interface Comment extends NodeAdditional {
        readonly type: "Comment";
        readonly raw: string;
        readonly value: string;
    }
    interface MarkerLocation {
        line: number;
        column: number;
    }
    interface MarkerLocations {
        start: MarkerLocation;
        end: MarkerLocation;
    }
    export module Tokens {
        export type EOF = 1;
        export type StringLiteral = 2;
        export type Identifier = 8;
        export type NumericLiteral = 16;
        export type Punctuator = 32;
        export type BooleanLiteral = 64;
        export type NilLiteral = 128;
        export type VarargLiteral = 256;
    }
    export interface Token {
        //readonly type: Tokens.EOF | Tokens.StringLiteral | Tokens.Identifier | Tokens.NumericLiteral |
        //	Tokens.Punctuator | Tokens.BooleanLiteral | Tokens.NilLiteral | Tokens.VarargLiteral;
        readonly type: number;
        readonly value: string;
        readonly line: number;
        readonly lineStart: number;
        readonly loc?: MarkerLocations;
        readonly range: [number, number];
    }
    export const defaultOptions: Options;
    export const version: string;

    export const ast: { [name: string]: any };

    export function end(code: string): Chunk;
    export function lex(): Token;
    export function parse(code: Options | string, options?: Options | null): Chunk;
    export function write(code: string): void;

    interface Options {
        wait?: boolean;
        comments?: boolean;
        scope?: boolean;
        locations?: boolean;
        ranges?: boolean;
        onCreateNode?: (node: Node) => void | null;
        onCreateScope?: Function | null;
        onDestroyScope?: Function | null;
        //luaVersion?: '5.1' | '5.2' | '5.3';
        luaVersion?: string;
    }
}
