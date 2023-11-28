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
