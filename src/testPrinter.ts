import * as luafmt from './index';
import * as fs from 'fs';

const file = fs.readFileSync('test/lua-5.3.4-tests/calls.lua');
const formatted = luafmt.formatText(file.toString());

console.log(formatted);
