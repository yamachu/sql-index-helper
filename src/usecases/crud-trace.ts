import { ColumnName, SQL, TableName } from "../types";
import {
    DeleteTableColumnAst,
    InsertTableColumnAst,
    SelectTableColumnAst,
    UpdateTableColumnAst,
} from "./types";

type CRUD = {
    select: boolean;
    update: string[] /* columnName */;
    insert: boolean;
    delete: boolean;
};

class TableCRUDMap extends Map<TableName, CRUD> {
    private defaultValue: CRUD = {
        select: false,
        update: [],
        insert: false,
        delete: false,
    };

    setSelect(tableName: TableName) {
        const tmp = this.get(tableName);
        if (tmp === undefined) {
            this.set(tableName, {
                ...this.defaultValue,
                select: true,
            });
            return;
        }
        this.set(tableName, {
            ...tmp,
            select: true,
        });
    }

    setDelete(tableName: TableName) {
        const tmp = this.get(tableName);
        if (tmp === undefined) {
            this.set(tableName, {
                ...this.defaultValue,
                delete: true,
            });
            return;
        }
        this.set(tableName, {
            ...tmp,
            delete: true,
        });
    }

    setInsert(tableName: TableName) {
        const tmp = this.get(tableName);
        if (tmp === undefined) {
            this.set(tableName, {
                ...this.defaultValue,
                insert: true,
            });
            return;
        }
        this.set(tableName, {
            ...tmp,
            insert: true,
        });
    }

    setUpdate(tableName: TableName, columns: ColumnName[]) {
        const tmp = this.get(tableName);
        if (tmp === undefined) {
            this.set(tableName, {
                ...this.defaultValue,
                update: columns,
            });
            return;
        }
        this.set(tableName, {
            ...tmp,
            update: [...tmp.update, ...columns],
        });
    }
}

export const crudTrace =
    (write: (value: string) => void) =>
    (
        selectMap: Map<SQL, SelectTableColumnAst>,
        updateMap: Map<SQL, UpdateTableColumnAst>,
        deleteMap: Map<SQL, DeleteTableColumnAst>,
        insertMap: Map<SQL, InsertTableColumnAst>,
    ) => {
        const crudMap = new TableCRUDMap();
        selectMap.forEach((ast) => {
            const tableName = ast.tableList[0].split("::")[2];
            crudMap.setSelect(tableName);
        });
        deleteMap.forEach((ast) => {
            const tableName = ast.tableList[0].split("::")[2];
            crudMap.setDelete(tableName);
        });
        insertMap.forEach((ast) => {
            const tableName = ast.tableList[0].split("::")[2];
            crudMap.setInsert(tableName);
        });
        updateMap.forEach((ast) => {
            const tableName = ast.tableList[0].split("::")[2];
            const columns = ast.ast.set.map((v) => v.column);
            crudMap.setUpdate(tableName, columns);
        });

        write('"tableName"\t"select"\t"insert"\t"update"\t"delete"');

        [...crudMap.entries()].forEach(([tableName, crud]) => {
            write(
                `${tableName}\t${crud.select ? "true" : ""}\t${
                    crud.insert ? "true" : ""
                }\t${crud.update.length > 0 ? crud.update.join(",") : ""}\t${
                    crud.delete ? "true" : ""
                }`,
            );
        });
    };
