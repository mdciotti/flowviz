// Type definitions for parse-ply
// Project: https://github.com/mikolalysenko/parse-ply
// Definitions by: Maxwell Ciotti <https://github.com/mdciotti/>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

/// <reference path="./node.d.ts" />

declare module "parse-ply" {

    function createPLYParser(stream, cb: (err: any, data?: any) => void);

    export default createPLYParser;
}
