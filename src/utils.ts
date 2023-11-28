import { Position, type NameWithPosition } from "./types";

export class AppendableMap<K, V> extends Map<K, Array<V>> {
    append(key: K, value: V) {
        const existingValues = this.get(key);
        if (existingValues) {
            existingValues.push(value);
        } else {
            this.set(key, [value]);
        }
    }
}

export const findIdByPos = (
    idsWithPos: NameWithPosition[],
    pos: Position,
): string | undefined => {
    const candidate = idsWithPos.filter(
        (v) => v.pos.start <= pos.start && v.pos.end >= pos.end,
    );

    return candidate.at(0)?.name;
};

export const trimString = (str: string): string =>
    str.trim().replaceAll("\n", "").replace(/\s+/g, " ");
