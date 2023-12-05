import { ColumnName, SQL, TableName } from "../types";
import { AppendableMap } from "../utils";
import { SelectTableColumnAst } from "./types";

export const selectSqlToMaybeIndex =
    (write: (value: string) => void) =>
    (selectMap: Map<SQL, SelectTableColumnAst>) => {
        const maybeIndexAndRelatedSqls: Map<
            TableName,
            AppendableMap<string /** JSON.stringify(maybeIndexArray) */, SQL>
        > = new Map();
        const unknownSQLs: Set<SQL> = new Set();

        [...selectMap.entries()].forEach(([sql, ast]) => {
            const result = ast.columnList.reduce(
                (acc, column) => {
                    //
                    const matchedColumn = column.match(/select::(.*)::(.*)/);
                    if (matchedColumn === null) {
                        return acc;
                    }
                    const [, tableName, columnName] = matchedColumn;
                    const v = acc[tableName];
                    if (v === undefined) {
                        if (columnName === "(.*)") {
                            return acc;
                        }
                        return {
                            ...acc,
                            [tableName]: [columnName],
                        };
                    }
                    return {
                        ...acc,
                        [tableName]: [...v, columnName],
                    };
                },
                {} as Record<TableName, ColumnName[]>,
            );
            if (result["null"] !== undefined && ast.tableList.length === 1) {
                const tmp = result["null"];
                delete result["null"];
                result[ast.tableList[0].split("::")[2]] = tmp;
            }
            if (Object.keys(result).includes("null")) {
                unknownSQLs.add(sql);
                return;
            }

            Object.entries(result).forEach(([tableName, maybeIndexArray]) => {
                const maybeAppendableMap =
                    maybeIndexAndRelatedSqls.get(tableName);
                if (maybeAppendableMap === undefined) {
                    const next = new AppendableMap<string, SQL>();
                    next.append(JSON.stringify(maybeIndexArray), sql);

                    maybeIndexAndRelatedSqls.set(tableName, next);
                } else {
                    maybeAppendableMap.append(
                        JSON.stringify(maybeIndexArray),
                        sql,
                    );
                }
            });
        });

        const sortedMaybeIndexAndRelatedSqls = [
            ...maybeIndexAndRelatedSqls.entries(),
        ]
            .map(([tableName, maybeAppendableMap]) => {
                return [
                    tableName,
                    [...maybeAppendableMap.entries()].sort((a, b) =>
                        a[0].localeCompare(b[0]),
                    ),
                ] as const;
            })
            .sort((a, b) => a[0].localeCompare(b[0]));

        write("-- start: auto generated add index --\n");

        sortedMaybeIndexAndRelatedSqls.forEach(
            ([tableName, maybeAppendableMap]) => {
                write(`-- ${tableName}`);
                maybeAppendableMap.forEach(([jsonStringifiedIndex, sqls]) => {
                    sqls.forEach((sql) => {
                        write(`-- \t ${sql}`);
                    });
                    const idxs: string[] = JSON.parse(jsonStringifiedIndex);
                    write(
                        `${
                            idxs.length === 1 && idxs[0] === "id" ? "-- " : ""
                        }ALTER TABLE ${tableName} ADD INDEX idx_${idxs.join(
                            "_",
                        )} (${idxs.join(", ")});`,
                    );
                });
            },
        );

        if (unknownSQLs.size > 0) {
            write("-- start: could not determined index --");
            unknownSQLs.forEach((sql) => {
                write(`-- \t ${sql}`);
            });
            write("-- end: could not determined index --");
        }

        write("-- end: auto generated add index --\n");
    };
