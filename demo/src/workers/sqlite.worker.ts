import sqlite3InitModule from '../../../index.mjs'

interface Sqlite3 {
	oo1: {
		DB: new (filename?: string, mode?: string) => Database
		OpfsDb?: new (filename: string) => Database
	}
	opfs?: unknown 
	version: { libVersion: string }
}

interface Database {
	exec(opts: { sql: string; callback?: (row: unknown[]) => void; columnNames?: string[]; bind?: unknown[] }): this
	exec(sql: string): this
	close(): void
	filename: string
}

type MessageType = { type: 'init' } | { type: 'exec'; sql: string; id: number } | { type: 'close' }
type ResponseType =
	| { type: 'ready'; version: string }
	| { type: 'log'; message: string }
	| { type: 'error'; message: string }
	| { type: 'result'; id: number; columns: string[]; values: unknown[][] }
	| { type: 'exec-done'; id: number }

let db: Database | null = null

const postLog = (message: string) => self.postMessage({ type: 'log', message } as ResponseType)
const postError = (message: string) => self.postMessage({ type: 'error', message } as ResponseType)

async function initialize() {
	try {
		postLog('Loading SQLite WASM module...')
		const sqlite3 = (await sqlite3InitModule({
			print: () => {},    
			printErr: () => {}, 
		})) as Sqlite3

		postLog(`SQLite version: ${sqlite3.version.libVersion}`)

		if (sqlite3.opfs && sqlite3.oo1.OpfsDb) {
			try {
				db = new sqlite3.oo1.OpfsDb('/worker-db.sqlite3')
				postLog(`Created OPFS database: ${db.filename}`)
			} catch {
				db = new sqlite3.oo1.DB(':memory:')
				postLog('OPFS unavailable, using in-memory database')
			}
		} else {
			db = new sqlite3.oo1.DB(':memory:')
			postLog('Using in-memory database')
		}

		self.postMessage({ type: 'ready', version: sqlite3.version.libVersion } as ResponseType)
	} catch (err) {
		postError(`Init failed: ${err instanceof Error ? err.message : String(err)}`)
	}
}

function execSql(sql: string, id: number) {
	if (!db) { postError('Database not initialized'); return }

	try {
		const statements = sql.split(';').map(s => s.trim()).filter(Boolean)

		for (const stmt of statements) {
			const isQuery = /^\s*(SELECT|PRAGMA|EXPLAIN|WITH)/i.test(stmt)

			if (isQuery) {
				const columns: string[] = []
				const values: unknown[][] = []
				db.exec({ sql: stmt, callback: (row) => values.push([...row]), columnNames: columns })
				if (columns.length > 0 || values.length > 0) {
					self.postMessage({ type: 'result', id, columns: [...columns], values } as ResponseType)
				}
			} else {
				db.exec(stmt)
			}
		}

		self.postMessage({ type: 'exec-done', id } as ResponseType)
	} catch (err) {
		postError(err instanceof Error ? err.message : String(err))
	}
}

self.onmessage = (e: MessageEvent<MessageType>) => {
	const msg = e.data
	switch (msg.type) {
		case 'init': initialize(); break
		case 'exec': execSql(msg.sql, msg.id); break
		case 'close': if (db) { db.close(); db = null }; break
	}
}
