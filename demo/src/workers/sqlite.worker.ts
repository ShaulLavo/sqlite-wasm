import sqlite3InitModule from '../../../index.mjs';
import { createClient, Sqlite3Client } from '../../../client/index.js';
import type { Sqlite3ClientType, PoolUtil } from '../../../client/types.js';

type MessageType =
  | { type: 'init' }
  | { type: 'exec'; sql: string; id: number }
  | { type: 'close' };
type ResponseType =
  | { type: 'ready'; version: string }
  | { type: 'log'; message: string }
  | { type: 'error'; message: string }
  | { type: 'result'; id: number; columns: string[]; values: unknown[][] }
  | { type: 'exec-done'; id: number };

let client: Sqlite3Client | null = null;

let sqlite3: Sqlite3ClientType | null = null;

const postLog = (message: string) =>
  self.postMessage({ type: 'log', message } as ResponseType);
const postError = (message: string) =>
  self.postMessage({ type: 'error', message } as ResponseType);

async function initialize() {
  try {
    postLog('Loading SQLite WASM module...');
    sqlite3 = await sqlite3InitModule({
      print: () => {},
      printErr: () => {},
    });

    if (!sqlite3) throw new Error('Failed to load sqlite3');

    postLog(`SQLite version: ${sqlite3.version.libVersion}`);

    // Check for OPFS support
    // In this demo worker, we try to use OPFS by default, falling back to memory
    let url = ':memory:';
    let poolUtil: PoolUtil | undefined = undefined;

    // @ts-ignore
    if (sqlite3.opfs && sqlite3.oo1.OpfsDb) {
      try {
        // Determine if we can use OPFS
        // The client wrapper uses 'file:' protocol and checks for poolUtil or checks sqlite3.oo1.OpfsDb
        // Here we just use a file path and the client logic will handle it if we pass the right things
        url = 'file:/worker-db.sqlite3';
        postLog(`Using OPFS database path: ${url}`);
      } catch {
        postLog('OPFS unavailable, using in-memory database');
      }
    } else {
      postLog('Using in-memory database');
    }

    const result = createClient({ url, poolUtil }, sqlite3);
    client = result[0];
    // If memory, it created a DB
    if (url !== ':memory:') {
      postLog(`Created OPFS database`);
    } else {
      postLog(`Created in-memory database`);
    }

    self.postMessage({
      type: 'ready',
      version: sqlite3.version.libVersion,
    } as ResponseType);
  } catch (err) {
    postError(
      `Init failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    console.error(err);
  }
}

async function execSql(sql: string, id: number) {
  if (!client) {
    postError('Client not initialized');
    return;
  }

  try {
    // Simple split by semicolon to handle multiple statements
    // Note: This is a naive implementation that doesn't handle semicolons in strings/comments
    // but matches the simple behavior of the other demo worker.
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      const result = await client.execute(stmt);

      // Convert ResultSet to the format compatible with our demo UI
      const columns = result.columns;
      const values = result.rows.map((row: any) => {
        return columns.map((col: any) => {
          // @ts-ignore
          return row[col];
        });
      });

      if (columns.length > 0 || values.length > 0) {
        self.postMessage({
          type: 'result',
          id,
          columns,
          values,
        } as ResponseType);
      }
    }

    self.postMessage({ type: 'exec-done', id } as ResponseType);
  } catch (err) {
    postError(err instanceof Error ? err.message : String(err));
  }
}

self.onmessage = (e: MessageEvent<MessageType>) => {
  const msg = e.data;
  switch (msg.type) {
    case 'init':
      initialize();
      break;
    case 'exec':
      execSql(msg.sql, msg.id);
      break;
    case 'close':
      if (client) {
        client.close();
        client = null;
      }
      break;
  }
};
