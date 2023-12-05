# SQL Index Helper

ISUCONで、Node.js実装のソースコードからSQLを解析し、INDEXを貼るサポートを行うツール。

## Usage

### Install

```sh
$ npm i @yamachu/sql-index-helper
```

### Collect SQL

```sh
$ npx jscodeshift --dry -s -t node_modules/@yamachu/sql-index-helper/dist/transforms/index.js --extensions ts targetFile_or_directory > collected_sql.log
```

### Create Index

```sh
$ npx sql-index-helper -f collected_sql.log 
```

### Dump SQL

```sh
$ npx sql-index-helper -f collected_sql.log -t dump
```

### Dump CRUD

```sh
$ npx sql-index-helper -f collected_sql.log -t crud
```

## Example

### Create Index

```sql
-- start: auto generated add index --

-- competition
--       SELECT * FROM competition WHERE id = ?
-- ALTER TABLE competition ADD INDEX idx_id (id);
--       SELECT * FROM competition WHERE tenant_id=? ORDER BY created_at DESC
--       SELECT * FROM competition WHERE tenant_id = ? ORDER BY created_at DESC
--       SELECT * FROM competition WHERE tenant_id = ? ORDER BY created_at ASC
ALTER TABLE competition ADD INDEX idx_tenant_id_created_at (tenant_id, created_at);
--       SELECT * FROM competition WHERE tenant_id = ?
ALTER TABLE competition ADD INDEX idx_tenant_id (tenant_id);
-- my_player_score
--       SELECT player_id FROM my_player_score WHERE tenant_id = ? AND competition_id = ?
ALTER TABLE my_player_score ADD INDEX idx_player_id_tenant_id_competition_id (player_id, tenant_id, competition_id);
--       SELECT * FROM my_player_score WHERE tenant_id = ? AND competition_id = ? AND player_id = ?
ALTER TABLE my_player_score ADD INDEX idx_tenant_id_competition_id_player_id (tenant_id, competition_id, player_id);
-- player
--       SELECT * FROM player WHERE id = ?
-- ALTER TABLE player ADD INDEX idx_id (id);
--       SELECT * FROM player WHERE tenant_id = ? ORDER BY created_at DESC
ALTER TABLE player ADD INDEX idx_tenant_id_created_at (tenant_id, created_at);
-- tenant
--       SELECT * FROM tenant ORDER BY id DESC
--       SELECT * FROM tenant WHERE id = ?
-- ALTER TABLE tenant ADD INDEX idx_id (id);
--       SELECT * FROM tenant WHERE name = ?
ALTER TABLE tenant ADD INDEX idx_name (name);
-- visit_history_min
--       SELECT player_id, created_at AS min_created_at FROM visit_history_min WHERE tenant_id = ? AND competition_id = ?
ALTER TABLE visit_history_min ADD INDEX idx_player_id_created_at_tenant_id_competition_id (player_id, created_at, tenant_id, competition_id);
-- start: could not determined index --
--       SELECT score, row_num, player_id, p.display_name as display_name FROM my_player_score mpc left join player p on p.id = mpc.player_id WHERE mpc.tenant_id = ? AND competition_id = ? ORDER BY row_num DESC
-- end: could not determined index --
-- end: auto generated add index --
```

## LICENSE

MIT
