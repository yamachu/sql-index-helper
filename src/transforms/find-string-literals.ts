import { ASTPath } from "jscodeshift";

import { ValueWithPosition } from "../types";
import { trimString } from "../utils";

export const findStringLiteralWithPosition = (
    rootNodes: ASTPath["node"][],
): ValueWithPosition[] => {
    return rootNodes.reduce((prev, curr) => {
        switch (true) {
            case curr.type === "StringLiteral":
                return [
                    ...prev,
                    {
                        pos: { start: curr.start, end: curr.end },
                        value: trimString(curr.value),
                    },
                ];
            case curr.type === "TemplateLiteral":
                return [
                    ...prev,
                    {
                        pos: { start: curr.start, end: curr.end },
                        value: trimString(
                            curr.quasis.at(0)?.value.cooked ?? "",
                        ),
                    },
                ];
            default:
                return prev;
        }
    }, [] as ValueWithPosition[]);
};
