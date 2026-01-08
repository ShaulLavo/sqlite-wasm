import sqlite3InitModule from '../../../index.mjs';
import { createClient, Sqlite3Client } from '../../../client/index.js';
import { Database } from '../../../index.mjs';

// Re-export QueryResult for demos
export interface QueryResult {
  columns: string[];
  values: unknown[][];
}

let client: Sqlite3Client | null = null;
let db: Database | null = null;
let sqlite3: any = null;

export async function initDb(): Promise<Sqlite3Client> {
  if (client) return client;

  // @ts-ignore
  sqlite3 = await sqlite3InitModule({
    print: () => {},
    printErr: () => {},
  });

  console.log('SQLite version:', sqlite3.version.libVersion);

  // Create in-memory DB via client wrapper
  const result = createClient({ url: ':memory:' }, sqlite3);
  client = result[0];
  db = result[1];

  return client;
}

export function getClient(): Sqlite3Client | null {
  return client;
}

export function getDb(): Database | null {
  return db;
}

export function getVersion(): string | null {
  return sqlite3?.version.libVersion ?? null;
}

function splitStatements(sql: string): string[] {
  const lines = sql.split('\n');
  const statements: string[] = [];
  let current = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('--')) {
      continue;
    }

    current += line + '\n';

    if (trimmed.endsWith(';')) {
      statements.push(current.trim());
      current = '';
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

export async function runQuery(sql: string): Promise<QueryResult[]> {
  if (!client) throw new Error('Database not initialized');

  const allResults: QueryResult[] = [];
  const statements = splitStatements(sql);

  for (const stmt of statements) {
    // Use client.execute() for each statement
    // Note: client.execute() returns a Promise<ResultSet>
    // ResultSet contains: columns, rows, rowsAffected, lastInsertRowid
    const rs = await client.execute(stmt);

    // Convert ResultSet to QueryResult format expected by demos
    if (rs.columns.length > 0 || rs.rows.length > 0) {
      const values = rs.rows.map((row: any) => {
        // Ensure row values are in column order
        return rs.columns.map((col: any) => {
          // @ts-ignore
          return row[col];
        });
      });
      allResults.push({ columns: rs.columns, values });
    }
  }

  return allResults;
}
