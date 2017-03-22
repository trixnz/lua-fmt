#!/usr/bin/env node

const pkg = require('../../package.json');

import * as program from 'commander';
import * as getStdin from 'get-stdin';
import { readFileSync } from 'fs';

import { formatText } from '../src/index';

program
    .version(pkg.version)
    .usage('[options] [file]')
    .option('--stdin', 'Read code from stdin');

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

if (program.stdin) {
    getStdin().then(input => {
        process.stdout.write(formatText(input));
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
        const formatted = formatText(input);

        process.stdout.write(formatted);
    } catch (err) {
        printError(filename, err);
    }
}
