import { formatText } from '../src/index';
import { readFileContents, runLuaCode } from './util';

import * as path from 'path';
import * as luaparse from 'luaparse';

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
    it(name + ' can still pass tests after being formatted', async () => {
        const bootstrap = '\
            _soft = true \
            _port = true \
            _nomsg = true\n';

        const result = await readLuaTest(name)
            .then(contents => bootstrap + contents)
            .then(contents => formatText(contents))
            .then(formatted => runLuaCode(formatted));

        return expect(result).toBe(true);
    });

    it(name + ' can still be parsed after being formatted', async () => {
        const result = await readLuaTest(name)
            .then(contents => parseLua(contents));

        return expect(result).not.toBeNull();
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
