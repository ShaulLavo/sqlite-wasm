export const PRESETS = {
	basic: {
		name: 'Basic Table',
		sql: `DROP TABLE IF EXISTS users;
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER);
INSERT INTO users (name, age) VALUES ('Alice', 30), ('Bob', 25), ('Charlie', 35);
SELECT * FROM users;
SELECT name, age FROM users WHERE age > 26 ORDER BY age DESC;`
	},
	fts5: {
		name: 'FTS5 Full-Text Search',
		sql: `DROP TABLE IF EXISTS docs;
CREATE VIRTUAL TABLE docs USING fts5(title, body);
INSERT INTO docs VALUES ('SQLite Guide', 'Learn how to use SQLite database for storage');
INSERT INTO docs VALUES ('WASM Tutorial', 'WebAssembly runs code in browsers at near-native speed');
INSERT INTO docs VALUES ('Vector Search', 'Find similar items using embeddings and distance metrics');
SELECT * FROM docs WHERE docs MATCH 'sqlite OR wasm';`
	},
	vector: {
		name: 'sqlite-vec Vector Search',
		sql: `SELECT vec_version();
DROP TABLE IF EXISTS embeddings;
CREATE VIRTUAL TABLE embeddings USING vec0(vector float[4]);
INSERT INTO embeddings(rowid, vector) VALUES 
  (1, '[1.0, 0.0, 0.0, 0.0]'),
  (2, '[0.0, 1.0, 0.0, 0.0]'),
  (3, '[0.9, 0.1, 0.0, 0.0]');
SELECT rowid, distance FROM embeddings 
WHERE vector MATCH '[1.0, 0.0, 0.0, 0.0]' 
ORDER BY distance LIMIT 3;`
	},
	json: {
		name: 'JSON Functions',
		sql: `SELECT json('{"name":"Alice","age":30}');
SELECT json_extract('{"user":{"name":"Bob"}}', '$.user.name');
DROP TABLE IF EXISTS configs;
CREATE TABLE configs (id INTEGER PRIMARY KEY, data TEXT);
INSERT INTO configs (data) VALUES ('{"theme":"dark","lang":"en"}');
SELECT id, json_extract(data, '$.theme') as theme FROM configs;`
	},
	soundex: {
		name: 'Soundex',
		sql: `SELECT soundex('Robert'), soundex('Rupert');
DROP TABLE IF EXISTS names;
CREATE TABLE names (id INTEGER PRIMARY KEY, name TEXT);
INSERT INTO names VALUES (1,'Robert'),(2,'Rupert'),(3,'Robin');
SELECT a.name, b.name as sounds_like
FROM names a, names b 
WHERE a.id < b.id AND soundex(a.name) = soundex(b.name);`
	},
	persistence: {
		name: 'OPFS Persistence',
		sql: `-- Data persists across page reloads!
CREATE TABLE IF NOT EXISTS notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO notes (content) VALUES ('Note at ' || datetime('now'));
SELECT * FROM notes ORDER BY id DESC LIMIT 10;`
	}
}

export type PresetKey = keyof typeof PRESETS
