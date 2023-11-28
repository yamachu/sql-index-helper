import {
    ExportNamedDeclaration,
    ExpressionStatement,
    FunctionDeclaration,
    Program,
    VariableDeclaration,
} from 'jscodeshift'

import { type NameWithPosition } from '../types'

export const findParentIdentifierWithPosition = (
    rootNodes: Program['body']
): NameWithPosition[] => {
    const initialReduceValue: NameWithPosition = {
        pos: { start: 0, end: 0 },
        name: '',
    }

    // const getTagHandler = () => {} の形式
    const variableDeclarations = rootNodes
        ?.filter(
            (v): v is VariableDeclaration => v.type === 'VariableDeclaration'
        )
        .reduce((prev, curr) => {
            const value = curr.declarations.reduce((prevDeclar, currDeclar) => {
                if (currDeclar.type === 'VariableDeclarator') {
                    return {
                        pos: { start: curr.start, end: curr.end },
                        name: currDeclar.id.name,
                    }
                } else {
                    return prevDeclar
                }
            }, initialReduceValue)
            return [...prev, value]
        }, [] as NameWithPosition[])

    // export const getTagHandler = () => {}
    // export function getTagHandler() {} の形式
    const exportNamedDeclarations = rootNodes
        ?.filter(
            (v): v is ExportNamedDeclaration =>
                v.type === 'ExportNamedDeclaration'
        )
        .reduce((prev, curr) => {
            if (curr.declaration?.type === 'VariableDeclaration') {
                const value = curr.declaration?.declarations.reduce(
                    (prevDeclar, currDeclar) => {
                        if (currDeclar.type === 'VariableDeclarator') {
                            return {
                                pos: { start: curr.start, end: curr.end },
                                name: currDeclar.id.name,
                            }
                        } else {
                            return prevDeclar
                        }
                    },
                    initialReduceValue
                )
                return [...prev, value]
            } else if (curr.declaration?.type === 'FunctionDeclaration') {
                return [
                    ...prev,
                    {
                        pos: { start: curr.start, end: curr.end },
                        name: curr.declaration?.id.name,
                    },
                ]
            }
            return prev
        }, [] as NameWithPosition[])

    // function getTagHandler() {} の形式
    const functionDeclarations = rootNodes
        ?.filter(
            (v): v is FunctionDeclaration => v.type === 'FunctionDeclaration'
        )
        .reduce((prev, curr) => {
            return [
                ...prev,
                {
                    pos: { start: curr.start, end: curr.end },
                    name: curr.id?.name!,
                },
            ]
        }, [] as NameWithPosition[])

    // app.get('/api/tag', () => {}) の形式
    const expressionStatements = rootNodes
        ?.filter(
            (v): v is ExpressionStatement => v.type === 'ExpressionStatement'
        )
        .reduce((prev, curr) => {
            const apiPath = curr.expression.arguments.at(0)?.value
            const callee = curr.expression.callee.property?.name

            if (callee === undefined) {
                return prev;
            }

            return [
                ...prev,
                {
                    pos: { start: curr.start, end: curr.end },
                    name: `${callee.toUpperCase()} ${apiPath}`,
                },
            ]
        }, [] as NameWithPosition[])

    return [
        ...variableDeclarations,
        ...exportNamedDeclarations,
        ...functionDeclarations,
        ...expressionStatements,
    ]
}
