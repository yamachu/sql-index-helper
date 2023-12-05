import { cac } from "cac";
import { readFile } from "node:fs/promises";

import { RunType, run } from "./index-helper";

const cli = cac();

cli.option("-f <file>", "file path: ./some_log.txt or stdin: -");
cli.option("-t <type>", "type: dump, crud, index", {
    default: "index",
});

const cliParsed = cli.parse();

const filePath = cliParsed.options.f;
const runType = cliParsed.options.t;

if (filePath === undefined) {
    cli.outputHelp();
    process.exit(1);
}

const isRunType = (runType: string): runType is RunType => {
    return ["dump", "crud", "index"].includes(runType);
};

if (!isRunType(runType)) {
    cli.outputHelp();
    process.exit(1);
}

const getLogFile = async (filePath: string) => {
    if (filePath === "-") {
        const buffers: Buffer[] = [];

        for await (const chunk of process.stdin) {
            buffers.push(chunk);
        }

        const buffer = Buffer.concat(buffers);
        return buffer.toString();
    } else {
        const f = await readFile(filePath, "utf-8");
        return f;
    }
};

(async (input) => {
    const logFile = await getLogFile(input);

    run(logFile, runType);
})(filePath);
