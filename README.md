[![Build Status](https://travis-ci.org/trixnz/lua-fmt.svg?branch=master)](https://travis-ci.org/trixnz/lua-fmt) [![NPM Package](https://img.shields.io/npm/v/lua-fmt.svg)](https://www.npmjs.com/package/lua-fmt)

# Code Formatter for Lua
`lua-fmt` is pretty-printer for [Lua](https://www.lua.org/) code, written in [TypeScript](https://www.typescriptlang.org/) and deeply inspired by [prettier](https://github.com/prettier/prettier). `lua-fmt` provides an interface to format Lua code that conforms to a single and consistent standard.

While not implemented yet, the interface will be customizable to tailor the output to the user's preferences: linebreaks, string style, etc.

## Installing
* `npm install lua-fmt`

## Usage
### API
```TypeScript
import {formatText} from 'lua-fmt';
console.log(formatText('local hello = "Hello"; print(hello .. " world!")'))
```

### Command Line
Format a single file:
* `luafmt test/lua-5.3.4-tests/calls.lua`

Format a stream from `stdin`:
* `cat test/lua-5.3.4-tests/calls.lua | luafmt --stdin`

## TODO
- [ ] Add support for a `.luafmt` preferences file

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
* [Oskar Schöldström](https://github.com/oxyc) - [luaparse](https://github.com/oxyc/luaparse): A Lua parser written in JavaScript
* [Christopher Chedeau](https://github.com/vjeux) - [prettier](https://github.com/prettier/prettier): Prettier is an opinionated JavaScript formatter.
* [Ben Newman](https://github.com/benjamn) - [recast](https://github.com/benjamn/recast): JavaScript syntax tree transformer, nondestructive pretty-printer, and automatic source map generator.
