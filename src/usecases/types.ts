import {
    AST,
    Delete,
    Insert_Replace,
    Select,
    TableColumnAst,
    Update,
} from "node-sql-parser";

export type SelectTableColumnAst = Omit<TableColumnAst, "ast"> & {
    ast: Select;
};
export type UpdateTableColumnAst = Omit<TableColumnAst, "ast"> & {
    ast: Update;
};
export type DeleteTableColumnAst = Omit<TableColumnAst, "ast"> & {
    ast: Delete;
};
export type InsertTableColumnAst = Omit<TableColumnAst, "ast"> & {
    ast: Insert_Replace;
};
export type OtherTableColumnAst = Omit<TableColumnAst, "ast"> & { ast: AST[] };
