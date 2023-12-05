import { SQL } from "../types";
import {
    DeleteTableColumnAst,
    InsertTableColumnAst,
    OtherTableColumnAst,
    SelectTableColumnAst,
    UpdateTableColumnAst,
} from "./types";

const writeFormatted =
    (write: (value: string) => void) =>
    (operation: string, sqls: Map<SQL, unknown>) => {
        write(`-- "${operation}" --`);
        [...sqls.keys()].forEach((sql) => {
            write(`-- \t${sql}`);
        });
        write("");
    };

export const dumpAllSqls =
    (write: (value: string) => void) =>
    (
        selectMap: Map<SQL, SelectTableColumnAst>,
        updateMap: Map<SQL, UpdateTableColumnAst>,
        deleteMap: Map<SQL, DeleteTableColumnAst>,
        insertMap: Map<SQL, InsertTableColumnAst>,
        otherMap: Map<SQL, OtherTableColumnAst>,
    ) => {
        write("-- start: dump all sqls --\n");

        (
            [
                ["select", selectMap],
                ["update", updateMap],
                ["delete", deleteMap],
                ["insert", insertMap],
                ["other", otherMap],
            ] as const
        ).forEach(([operation, sqls]) => {
            writeFormatted(write)(operation, sqls);
        });

        write("-- end: dump all sqls --\n");
    };
