import sqlite3InitModule from '../../../index.mjs'

interface Sqlite3 {
	oo1: {
		DB: new (filename?: string, mode?: string) => Database
	}
	version: {
		libVersion: string
	}
}

interface Database {
	exec(opts: {
		sql: string
		callback?: (row: unknown[]) => void
		columnNames?: string[]
		bind?: unknown[]
	}): this
	exec(sql: string): this
	close(): void
}

let db: Database | null = null
let sqlite3: Sqlite3 | null = null

export async function initDb(): Promise<Database> {
	if (db) return db

	sqlite3 = (await sqlite3InitModule({
		print: () => {},
		printErr: () => {},
	})) as Sqlite3
	console.log('SQLite version:', sqlite3.version.libVersion)

	db = new sqlite3.oo1.DB(':memory:')
	return db
}

export function getDb(): Database | null {
	return db
}

export function getVersion(): string | null {
	return sqlite3?.version.libVersion ?? null
}

export interface QueryResult {
	columns: string[]
	values: unknown[][]
}

function splitStatements(sql: string): string[] {
	const lines = sql.split('\n')
	const statements: string[] = []
	let current = ''

	for (const line of lines) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith('--')) {
			continue
		}

		current += line + '\n'

		if (trimmed.endsWith(';')) {
			statements.push(current.trim())
			current = ''
		}
	}

	if (current.trim()) {
		statements.push(current.trim())
	}

	return statements
}

export function runQuery(sql: string): QueryResult[] {
	if (!db) throw new Error('Database not initialized')

	const allResults: QueryResult[] = []
	const statements = splitStatements(sql)

	for (const stmt of statements) {
		const isQuery = /^\s*(SELECT|PRAGMA|EXPLAIN|WITH)/i.test(stmt)

		if (isQuery) {
			const columns: string[] = []
			const values: unknown[][] = []

			db.exec({
				sql: stmt,
				callback: (row: unknown[]) => {
					values.push([...row])
				},
				columnNames: columns
			})

			if (columns.length > 0 || values.length > 0) {
				allResults.push({ columns: [...columns], values })
			}
		} else {
			db.exec({ sql: stmt })
		}
	}

	return allResults
}
