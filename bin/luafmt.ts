#!/usr/bin/env node

const pkg = require('../../package.json');

import * as program from 'commander';
import * as getStdin from 'get-stdin';
import { readFileSync, writeFileSync } from 'fs';

import { formatText, producePatch } from '../src/index';
import { UserOptions, defaultOptions, WriteMode, Quotemark } from '../src/options';

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

function parseQuotemark(inputString: Quotemark, defaultValue: Quotemark): Quotemark {
    return inputString === 'single' || inputString === 'double' ? inputString : defaultValue;
}

function printFormattedDocument(filename: string, originalDocument: string, formattedDocument: string,
    options: UserOptions) {
    switch (options.writeMode) {
        case 'stdout':
            process.stdout.write(formattedDocument);
            break;

        case 'diff':
            process.stdout.write(producePatch(filename, originalDocument, formattedDocument));
            break;

        case 'replace':
            if (filename === '<stdin>') {
                printError(filename, new Error('Write mode \'replace\' is incompatible with --stdin'));
            }

            try {
                writeFileSync(filename, formattedDocument);
            } catch (err) {
                printError(filename, err);
            }
            break;
    }
}

program
    .version(pkg.version)
    .usage('[options] [file]')
    .option('--stdin', 'Read code from stdin')
    .option('-l, --line-width <width>', 'Maximum length of a line before it will be wrapped',
    myParseInt, defaultOptions.lineWidth)
    .option('-i, --indent-count <count>', 'Number of characters to indent', myParseInt, defaultOptions.indentCount)
    .option('-q, --quotemark <double|single>', 'Use double or single quotes', parseQuotemark, defaultOptions.quotemark)
    .option('--use-tabs', 'Use tabs instead of spaces for indentation')
    .option('-w, --write-mode <stdout|replace|diff>', 'Mode for output', parseWriteMode, defaultOptions.writeMode);

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
    quotemark: program.quotemark,
    useTabs: program.useTabs,
    writeMode: program.writeMode
};

if (program.stdin) {
    getStdin().then(input => {
        printFormattedDocument('<stdin>', input, formatText(input, customOptions), customOptions);
    }).catch((err: Error) => {
        printError('<stdin>', err);
    });
} else {
    if (program.args.length === 0) {
        console.error('Expected <file.lua>');
        program.outputHelp();
        process.exit(1);
    }

    const filename = program.args[0];
    let input = '';

    try {
        input = readFileSync(filename).toString();
    } catch (err) {
        printError(filename, err);
    }

    try {
        const formatted = formatText(input, customOptions);

        printFormattedDocument(filename, input, formatted, customOptions);
    } catch (err) {
        printError(filename, err);
    }
}
