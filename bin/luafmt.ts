#!/usr/bin/env node

const pkg = require('../../package.json');

import * as program from 'commander';
import * as getStdin from 'get-stdin';
import * as globby from 'globby';
import { promisify } from 'util';
import { readFile, writeFile } from 'fs';

import { formatText, producePatch } from '../src/index';
import { UserOptions, defaultOptions, WriteMode } from '../src/options';

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);

function myParseInt(inputString: string, defaultValue: number) {
    const int = parseInt(inputString, 10);

    if (isNaN(int)) {
        return defaultValue;
    }

    return int;
}

function parseWriteMode(inputString: string, defaultValue: WriteMode) {
    for (const key of Object.keys(WriteMode)) {
        if (WriteMode[key] === inputString) { return inputString; }
    }

    return defaultValue;
}

function printFormattedDocument(filename: string, originalDocument: string, formattedDocument: string,
    options: UserOptions) {
    switch (options.writeMode) {
        case 'stdout':
            process.stdout.write(formattedDocument);
            return Promise.resolve();

        case 'diff':
            process.stdout.write(producePatch(filename, originalDocument, formattedDocument));
            return Promise.resolve();

        case 'replace':
            if (filename === '<stdin>') {
                throw new Error('Write mode \'replace\' is incompatible with --stdin');
            }

            return writeFileAsync(filename, formattedDocument);

        default:
            throw new Error(`Invalid write mode \'${options.writeMode}\'`);
    }
}

program
    .version(pkg.version)
    .usage('[options] [file|pattern ...]')
    .option('--stdin', 'Read code from stdin')
    .option('-l, --line-width <width>', 'Maximum length of a line before it will be wrapped',
    myParseInt, defaultOptions.lineWidth)
    .option('-i, --indent-count <count>', 'Number of characters to indent', myParseInt, defaultOptions.indentCount)
    .option('--use-tabs', 'Use tabs instead of spaces for indentation')
    .option('-w, --write-mode <mode>', 'Mode for output', parseWriteMode, defaultOptions.writeMode);

program.parse(process.argv);

function printError(filename: string, err: Error) {
    if (err instanceof SyntaxError) {
        console.error(`Failed to parse ${filename}:`, err);
        process.exit(2);
    } else {
        console.error(`Failed to format ${filename}:`, err);
        process.exit(3);
    }
}

const customOptions: UserOptions = {
    lineWidth: program.lineWidth,
    indentCount: program.indentCount,
    useTabs: program.useTabs,
    writeMode: program.writeMode
};

if (program.stdin) {
    getStdin()
        .then((input: string) => {
            return printFormattedDocument('<stdin>', input, formatText(input, customOptions), customOptions);
        })
        .then(() => {
            process.exit(0);
        })
        .catch((err: Error) => {
            printError('<stdin>', err);
        });
}

if (program.args.length === 0) {
    console.error('Expected <file.lua>');
    program.outputHelp();
    process.exit(1);
}

function formatFile(filename: string) {
    return readFileAsync(filename, 'utf-8')
        .then((input: string) => {
            const formatted = formatText(input, customOptions);
            return printFormattedDocument(filename, input, formatted, customOptions);
        })
        .catch((err: Error) => {
            throw { filename, err };
        });
}

globby(program.args, { dot: true, onlyFiles: true })
    .then((filenames: string[]) => {
        return Promise.all(filenames.map(formatFile));
    })
    .catch((reason: { filename: string, err: Error }) => {
        printError(reason.filename, reason.err);
    });
