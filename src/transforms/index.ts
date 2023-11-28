import { Transform } from 'jscodeshift'
import { Parser, TableColumnAst } from 'node-sql-parser'

import { AppendableMap, findIdByPos } from '../utils'
import { findParentIdentifierWithPosition } from './find-parent-identifier'
import { findStringLiteralWithPosition } from './find-string-literals'

module.exports = function transformer(file, api, options) {
    const j = api.jscodeshift
    const rootSource = j(file.source)
    const rootNodes = rootSource.find(j.Program).paths().at(0)?.value.body

    if (rootNodes === undefined) {
        console.error('rootNodes is undefined')
        return file.source
    }

    const idsWithPos = findParentIdentifierWithPosition(rootNodes)
    const queryCandidatesWithPos = findStringLiteralWithPosition([
        ...rootSource.find(j.StringLiteral).nodes(),
        ...rootSource.find(j.TemplateLiteral).nodes(),
    ])

    const parser = new Parser()

    const idWithAsts = new AppendableMap<
        string,
        { sql: string; ast: TableColumnAst }
    >()

    queryCandidatesWithPos.forEach((queryCandidate) => {
        try {
            const parsed = parser.parse(queryCandidate.value)
            const maybeId = findIdByPos(idsWithPos, queryCandidate.pos)

            // どこにも紐づいていないSQLはNO_PARENTというキーで保存する
            idWithAsts.append(maybeId ?? 'NO_PARENT', {
                sql: queryCandidate.value,
                ast: parsed,
            })
        } catch (e) {
            // 握りつぶす
        }
    })

    console.dir(idWithAsts)

    // NOTE: コードの解析のみに使用するため、変更せずにそのまま返している
    return file.source
} satisfies Transform

module.exports.parser = 'ts'
