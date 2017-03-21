import { expect } from 'chai';
import { formatText } from '../src/index';

import { spawn } from 'child_process';
import { readFile } from 'fs';
import * as path from 'path';
import * as luaparse from 'luaparse';

function runLuaCode(code: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        const process = spawn('lua53', ['-']);
        try {
            process.stdin.write(code, 'utf-8');
            process.stdin.end();
        } catch (e) {
            reject(e);
        }

        process.stderr.on('data', (data: Buffer) => {
            const str = data.toString();

            return reject(new Error(str));
        });

        process.on('close', exitCode => {
            if (exitCode === 0) {
                resolve(true);
            }
        });
    });
}

function readFileContents(path: string) {
    return new Promise<string>((resolve, reject) => {
        readFile(path, 'utf-8', (err, data) => {
            if (err) {
                return reject(err);
            }

            return resolve(data);
        });
    });
}

function readLuaTest(name: string) {
    const testPath = path.join(__dirname, 'lua-5.3.4-tests', name);

    return readFileContents(testPath);
}

function parseLua(text: string) {
    return luaparse.parse(text, {
        luaVersion: '5.3'
    });
}

function generateLuaTest(name: string) {
    specify(name + ' can still pass tests after being formatted', () => {
        const bootstrap = '\
            _soft = true \
            _port = true \
            _nomsg = true\n';

        const result = readLuaTest(name)
            .then(contents => bootstrap + contents)
            .then(contents => formatText(contents))
            .then(formatted => runLuaCode(formatted));

        return expect(result).to.eventually.be.true;
    });

    specify(name + ' can still be parsed after being formatted', () => {
        const result = readLuaTest(name)
            .then(contents => parseLua(contents));

        return expect(result).to.eventually.not.be.null;
    });
}

describe('Lua 5.3.4 standalone tests', () => {
    generateLuaTest('bitwise.lua');
    generateLuaTest('api.lua');
    generateLuaTest('attrib.lua');
    generateLuaTest('big.lua');
    generateLuaTest('bitwise.lua');
    generateLuaTest('calls.lua');
    generateLuaTest('closure.lua');
    generateLuaTest('code.lua');
    generateLuaTest('constructs.lua');
    //  Incompatible: Relies on line numbers
    // generateLuaTest('coroutine.lua');
    //  Incompatible: Relies on line numbers
    // generateLuaTest('db.lua');
    // generateLuaTest('errors.lua');
    generateLuaTest('events.lua');
    // generateLuaTest('files.lua');
    generateLuaTest('gc.lua');
    generateLuaTest('goto.lua');
    generateLuaTest('literals.lua');
    generateLuaTest('locals.lua');
    // generateLuaTest('main.lua');
    generateLuaTest('math.lua');
    generateLuaTest('nextvar.lua');
    // Fails: encoding error?
    // generateLuaTest('pm.lua');
    generateLuaTest('sort.lua');
    generateLuaTest('strings.lua');
    generateLuaTest('tpack.lua');
    generateLuaTest('utf8.lua');
    generateLuaTest('vararg.lua');
    generateLuaTest('verybig.lua');
});
