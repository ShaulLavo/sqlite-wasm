import { Database, Sqlite3Static } from '../index.mjs';
import { Client, InArgs, InStatement, IntMode, Replicated, ResultSet, Transaction, TransactionMode } from './api.js';
import type { Config, ExpandedConfig, PoolUtil, Sqlite3ClientType } from './types.js';
export type { Config, ExpandedConfig, PoolUtil, Sqlite3ClientType };
export declare function createClient(config: Config, sqlite3: Sqlite3ClientType): [Sqlite3Client, Database];
/** @private */
export declare function _createClient(config: ExpandedConfig, sqlite3: Sqlite3ClientType): [Sqlite3Client, Database];
export declare class Sqlite3Client implements Client {
    #private;
    closed: boolean;
    protocol: 'file';
    /** @private */
    constructor(sqlite3: Sqlite3Static, path: string, db: Database, intMode: IntMode, poolUtil?: PoolUtil | undefined);
    execute(stmtOrSql: InStatement | string, args?: InArgs): Promise<ResultSet>;
    executeSync(stmtOrSql: InStatement | string, args?: InArgs): ResultSet;
    batch(stmts: Array<InStatement>, mode?: TransactionMode): Promise<Array<ResultSet>>;
    migrate(stmts: Array<InStatement>): Promise<Array<ResultSet>>;
    transaction(mode?: TransactionMode): Promise<Transaction>;
    executeMultiple(sql: string): Promise<void>;
    sync(): Promise<Replicated>;
    close(): void;
}
export declare class Sqlite3Transaction implements Transaction {
    #private;
    /** @private */
    constructor(sqlite3: Sqlite3Static, database: Database, intMode: IntMode);
    execute(stmt: InStatement): Promise<ResultSet>;
    batch(stmts: Array<InStatement>): Promise<Array<ResultSet>>;
    executeMultiple(sql: string): Promise<void>;
    rollback(): Promise<void>;
    commit(): Promise<void>;
    close(): void;
    get closed(): boolean;
}
