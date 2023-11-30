import { Transform } from "jscodeshift";
import { Parser } from "node-sql-parser";

import { AppendableMap, findIdByPos } from "../utils";
import { findParentIdentifierWithPosition } from "./find-parent-identifier";
import { findStringLiteralWithPosition } from "./find-string-literals";

module.exports = function transformer(file, api, options) {
    const j = api.jscodeshift;
    const rootSource = j(file.source);
    const rootNodes = rootSource.find(j.Program).paths().at(0)?.value.body;

    if (rootNodes === undefined) {
        console.error("rootNodes is undefined");
        return file.source;
    }

    const idsWithPos = findParentIdentifierWithPosition(rootNodes);
    const queryCandidatesWithPos = findStringLiteralWithPosition([
        ...rootSource.find(j.StringLiteral).nodes(),
        ...rootSource.find(j.TemplateLiteral).nodes(),
    ]);

    const parser = new Parser();

    const idWithSQLs = new AppendableMap<string, string /* SQL */>();

    queryCandidatesWithPos.forEach((queryCandidate) => {
        try {
            parser.parse(queryCandidate.value);
            const maybeId = findIdByPos(idsWithPos, queryCandidate.pos);

            // どこにも紐づいていないSQLはNO_PARENTというキーで保存する
            idWithSQLs.append(maybeId ?? "NO_PARENT", queryCandidate.value);
        } catch (e) {
            // 握りつぶす
        }
    });

    if (idWithSQLs.size === 0) {
        return file.source;
    }

    /* 以下の形式でstdoutに出力される
     REP ファイル名 {"someFunction":["SELECT * FROM users"]}
    */
    api.report(JSON.stringify(idWithSQLs.toJson()));

    // NOTE: コードの解析のみに使用するため、変更せずにそのまま返している
    return file.source;
} satisfies Transform;

module.exports.parser = "ts";
