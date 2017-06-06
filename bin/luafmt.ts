#!/usr/bin/env node

const pkg = require('../../package.json');

import * as program from 'commander';
import * as getStdin from 'get-stdin';
import { readFileSync } from 'fs';

import { formatText } from '../src/index';
import { UserOptions, defaultOptions } from '../src/options';

function myParseInt(inputString: string, defaultValue: number) {
    const int = parseInt(inputString, 10);

    if (isNaN(int)) {
        return defaultValue;
    }

    return int;
}

program
    .version(pkg.version)
    .usage('[options] [file]')
    .option('--stdin', 'Read code from stdin')
    .option('-l, --line-width <width>', 'Maximum length of a line before it will be wrapped',
    myParseInt, defaultOptions.lineWidth)
    .option('-i, --indent-count <count>', 'Number of characters to indent', myParseInt, defaultOptions.indentCount);

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
    indentCount: program.indentCount
};

if (program.stdin) {
    getStdin().then(input => {
        process.stdout.write(formatText(input, customOptions));
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

        process.stdout.write(formatted);
    } catch (err) {
        printError(filename, err);
    }
}
