// Type definitions for through
// Project: https://github.com/dominictarr/through
// Definitions by: Andrew Gaspar <https://github.com/AndrewGaspar/>
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

/// <reference path="./node.d.ts" />

declare module "through" {
    import stream = require("stream");

    function through(write?: (data: any) => void,
        end?: () => void,
        opts?: {
            autoDestroy: boolean;
        }): through.ThroughStream;

    namespace through {
        export interface ThroughStream extends stream.Transform {
            autoDestroy: boolean;
        }
    }

    export default through;
}
