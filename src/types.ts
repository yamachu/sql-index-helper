export type Position = {
    start: number;
    end: number;
};

export type NameWithPosition = {
    pos: Position;
    name: string;
};

export type ValueWithPosition = {
    pos: Position;
    value: string;
};

export type FileName = string;

export type FunctionName = string;

export type SQL = string;

export type TableName = string;

export type ColumnName = string;
