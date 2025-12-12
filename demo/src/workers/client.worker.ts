import sqlite3InitModule from '../../../index.mjs';
import { createClient, Sqlite3Client } from '../../../client';
import type { Sqlite3ClientType, PoolUtil } from '../../../client/types';

interface Sqlite3 extends Sqlite3ClientType {
  opfs?: unknown;
}

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

const DB_NAME = 'client-demo';

async function initialize() {
  try {
    postLog('Loading SQLite WASM module...');
    // @ts-ignore
    sqlite3 = await sqlite3InitModule({
      print: () => {},
      printErr: () => {},
    });

    if (!sqlite3) throw new Error('Failed to load sqlite3');

    postLog(`SQLite version: ${sqlite3.version.libVersion}`);

    // @ts-ignore
    const poolUtil = await sqlite3.installOpfsSAHPoolVfs({
      name: DB_NAME,
      initialCapacity: 10,
      directory: '/.opfs-sahpool',
    });

    postLog('OPFS SAH Pool VFS installed');
    const result = createClient({ url: `file:${DB_NAME}`, poolUtil }, sqlite3);
    client = result[0];
    postLog(`Client created with URL: file:${DB_NAME}`);

    await client.execute(`PRAGMA foreign_keys = ON;`);
    postLog('Foreign keys enabled');

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
      const values = result.rows.map((row) => {
        return columns.map((col) => {
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
