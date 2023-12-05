import { Parser, TableColumnAst } from "node-sql-parser";

import type { FileName, FunctionName, SQL } from "./types";
import { crudTrace } from "./usecases/crud-trace";
import { dumpAllSqls } from "./usecases/dump-all";
import { selectSqlToMaybeIndex } from "./usecases/index-helper";
import type {
    DeleteTableColumnAst,
    InsertTableColumnAst,
    OtherTableColumnAst,
    SelectTableColumnAst,
    UpdateTableColumnAst,
} from "./usecases/types";

const parseLog = (log: string): Record<FileName, Record<FunctionName, SQL[]>> =>
    log
        .split("\n")
        .filter((v) => v.startsWith(" REP "))
        .map((v) => v.slice(5))
        .map((v) => {
            const [fileName, ...entries] = v.split(" ");
            return { [fileName]: JSON.parse(entries.join(" ")) };
        })
        .reduce((acc, v) => {
            return { ...acc, ...v };
        });

const logToParsedAsts =
    (parser: Parser) =>
    (
        logEntries: Record<FileName, Record<FunctionName, SQL[]>>,
    ): Map<
        FileName,
        Map<FunctionName, { sql: SQL; parsed: TableColumnAst }[]>
    > => {
        const result = new Map<
            FileName,
            Map<FunctionName, { sql: SQL; parsed: TableColumnAst }[]>
        >();

        Object.entries(logEntries).forEach(([fileName, entries]) => {
            const parsedSqlsMap = new Map<
                FunctionName,
                { sql: SQL; parsed: TableColumnAst }[]
            >();

            Object.entries(entries).forEach(([functionName, sqls]) => {
                parsedSqlsMap.set(
                    functionName,
                    sqls.map((sql) => {
                        return { sql, parsed: parser.parse(sql) };
                    }),
                );
            });

            result.set(fileName, parsedSqlsMap);
        });

        return result;
    };

const determineTableColumnAstType = (
    ast: TableColumnAst,
):
    | { type: "select"; ast: SelectTableColumnAst }
    | { type: "update"; ast: UpdateTableColumnAst }
    | { type: "delete"; ast: DeleteTableColumnAst }
    | { type: "insert"; ast: InsertTableColumnAst }
    | { type: "other"; ast: OtherTableColumnAst } => {
    const maybeAst = ast.ast;
    if (Array.isArray(maybeAst)) {
        // create index, replace into select…またサブクエリの様な物が発生しているもの
        return { type: "other", ast: { ...ast, ast: maybeAst } };
    }

    switch (true) {
        case maybeAst.type === "select": {
            return { type: "select", ast: { ...ast, ast: maybeAst } };
        }
        case maybeAst.type === "update": {
            return { type: "update", ast: { ...ast, ast: maybeAst } };
        }
        case maybeAst.type === "delete": {
            return { type: "delete", ast: { ...ast, ast: maybeAst } };
        }
        case maybeAst.type === "insert" || maybeAst.type === "replace": {
            return { type: "insert", ast: { ...ast, ast: maybeAst } };
        }
        default: {
            return { type: "other", ast: { ...ast, ast: [maybeAst] } };
        }
    }
};

export type RunType = "dump" | "crud" | "index";

export const run = (input: string, runType: RunType) => {
    const parsedLog = parseLog(input);
    const fileCallerParsedSqls = logToParsedAsts(new Parser())(parsedLog);

    const selectMap: Map<SQL, SelectTableColumnAst> = new Map();
    const updateMap: Map<SQL, UpdateTableColumnAst> = new Map();
    const deleteMap: Map<SQL, DeleteTableColumnAst> = new Map();
    const insertMap: Map<SQL, InsertTableColumnAst> = new Map();
    const otherMap: Map<SQL, OtherTableColumnAst> = new Map();

    [...fileCallerParsedSqls.values()].forEach((v) => {
        [...v.values()].forEach((sqlsWithParsed) => {
            sqlsWithParsed.forEach(({ sql, parsed }) => {
                const { type, ast } = determineTableColumnAstType(parsed);
                switch (type) {
                    case "select": {
                        selectMap.set(sql, ast);
                        return;
                    }
                    case "update": {
                        updateMap.set(sql, ast);
                        return;
                    }
                    case "delete": {
                        deleteMap.set(sql, ast);
                        return;
                    }
                    case "insert": {
                        insertMap.set(sql, ast);
                        return;
                    }
                    case "other": {
                        otherMap.set(sql, ast);
                        return;
                    }
                }
            });
        });
    });

    switch (runType) {
        case "dump": {
            dumpAllSqls(console.log)(
                selectMap,
                updateMap,
                deleteMap,
                insertMap,
                otherMap,
            );
            return;
        }
        case "crud": {
            crudTrace(console.log)(selectMap, updateMap, deleteMap, insertMap);
            return;
        }
        case "index": {
            selectSqlToMaybeIndex(console.log)(selectMap);
            return;
        }
    }
};
