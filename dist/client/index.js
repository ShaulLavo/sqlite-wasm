var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Sqlite3Client_instances, _Sqlite3Client_sqlite3, _Sqlite3Client_path, _Sqlite3Client_db, _Sqlite3Client_intMode, _Sqlite3Client_poolUtil, _Sqlite3Client_checkNotClosed, _Sqlite3Client_getDb, _Sqlite3Transaction_instances, _Sqlite3Transaction_sqlite3, _Sqlite3Transaction_database, _Sqlite3Transaction_intMode, _Sqlite3Transaction_checkNotClosed;
import { LibsqlError, } from './api.js';
import { expandConfig } from './config.js';
import { ResultSetImpl, supportedUrlLink, transactionModeToBegin, } from './util.js';
export function createClient(config, sqlite3) {
    return _createClient({ ...expandConfig(config, true), poolUtil: config.poolUtil }, sqlite3);
}
/** @private */
function createDb(sqlite3, path, poolUtil) {
    let db;
    if (poolUtil) {
        db = new poolUtil.OpfsSAHPoolDb(path);
    }
    else if ('opfs' in sqlite3) {
        db = new sqlite3.oo1.OpfsDb(path, 'c');
    }
    else {
        db = new sqlite3.oo1.DB();
    }
    return db;
}
/** @private */
export function _createClient(config, sqlite3) {
    if (config.scheme !== 'file') {
        throw new LibsqlError(`URL scheme ${JSON.stringify(config.scheme + ':')} is not supported by the local sqlite3 client. ` +
            `For more information, please read ${supportedUrlLink}`, 'URL_SCHEME_NOT_SUPPORTED');
    }
    if (config.encryptionKey !== undefined) {
        throw new LibsqlError('Encryption key is not supported by the Wasm client.', 'ENCRYPTION_KEY_NOT_SUPPORTED');
    }
    const authority = config.authority;
    if (authority !== undefined) {
        const host = authority.host.toLowerCase();
        if (host !== '' && host !== 'localhost') {
            throw new LibsqlError(`Invalid host in file URL: ${JSON.stringify(authority.host)}. ` +
                'A "file:" URL with an absolute path should start with one slash ("file:/absolute/path.db") ' +
                'or with three slashes ("file:///absolute/path.db"). ' +
                `For more information, please read ${supportedUrlLink}`, 'URL_INVALID');
        }
        if (authority.port !== undefined) {
            throw new LibsqlError('File URL cannot have a port', 'URL_INVALID');
        }
        if (authority.userinfo !== undefined) {
            throw new LibsqlError('File URL cannot have username and password', 'URL_INVALID');
        }
    }
    const path = config.path;
    // const options = {
    // 	authToken: config.authToken,
    // 	syncUrl: config.syncUrl
    // }
    const db = createDb(sqlite3, path, config.poolUtil);
    executeStmt(sqlite3, db, 'SELECT 1 AS checkThatTheDatabaseCanBeOpened', config.intMode);
    executeStmt(sqlite3, db, 'PRAGMA table_info(users)', config.intMode);
    const clinet = new Sqlite3Client(sqlite3, path, db, config.intMode, config.poolUtil);
    return [clinet, db];
}
/**
 * Check if the database is currently in a transaction. When autocommit is OFF
 * (returns 0), we are in a transaction.
 */
function inTransaction(sqlite3, db) {
    // sqlite3_get_autocommit returns non-zero if in autocommit mode (no transaction)
    // and zero if a transaction is active
    const autocommit = sqlite3.capi.sqlite3_get_autocommit(db.pointer);
    return autocommit === 0;
}
export class Sqlite3Client {
    /** @private */
    constructor(sqlite3, path, 
    /*options: Database.Options,*/ db, intMode, poolUtil) {
        _Sqlite3Client_instances.add(this);
        _Sqlite3Client_sqlite3.set(this, void 0);
        _Sqlite3Client_path.set(this, void 0);
        _Sqlite3Client_db.set(this, void 0);
        _Sqlite3Client_intMode.set(this, void 0);
        _Sqlite3Client_poolUtil.set(this, void 0);
        __classPrivateFieldSet(this, _Sqlite3Client_sqlite3, sqlite3, "f");
        __classPrivateFieldSet(this, _Sqlite3Client_path, path, "f");
        //this.#options = options;
        __classPrivateFieldSet(this, _Sqlite3Client_db, db, "f");
        __classPrivateFieldSet(this, _Sqlite3Client_intMode, intMode, "f");
        this.closed = false;
        this.protocol = 'file';
        __classPrivateFieldSet(this, _Sqlite3Client_poolUtil, poolUtil, "f");
    }
    async execute(stmtOrSql, args) {
        let stmt;
        if (typeof stmtOrSql === 'string') {
            stmt = {
                sql: stmtOrSql,
                args: args || [],
            };
        }
        else {
            stmt = stmtOrSql;
        }
        __classPrivateFieldGet(this, _Sqlite3Client_instances, "m", _Sqlite3Client_checkNotClosed).call(this);
        return executeStmt(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), __classPrivateFieldGet(this, _Sqlite3Client_instances, "m", _Sqlite3Client_getDb).call(this), stmt, __classPrivateFieldGet(this, _Sqlite3Client_intMode, "f"));
    }
    executeSync(stmtOrSql, args) {
        let stmt;
        if (typeof stmtOrSql === 'string') {
            stmt = {
                sql: stmtOrSql,
                args: args || [],
            };
        }
        else {
            stmt = stmtOrSql;
        }
        __classPrivateFieldGet(this, _Sqlite3Client_instances, "m", _Sqlite3Client_checkNotClosed).call(this);
        return executeStmt(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), __classPrivateFieldGet(this, _Sqlite3Client_instances, "m", _Sqlite3Client_getDb).call(this), stmt, __classPrivateFieldGet(this, _Sqlite3Client_intMode, "f"));
    }
    async batch(stmts, mode = 'deferred') {
        __classPrivateFieldGet(this, _Sqlite3Client_instances, "m", _Sqlite3Client_checkNotClosed).call(this);
        const db = __classPrivateFieldGet(this, _Sqlite3Client_instances, "m", _Sqlite3Client_getDb).call(this);
        try {
            executeStmt(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), db, transactionModeToBegin(mode), __classPrivateFieldGet(this, _Sqlite3Client_intMode, "f"));
            const resultSets = stmts.map((stmt) => {
                if (!inTransaction(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), db)) {
                    throw new LibsqlError('The transaction has been rolled back', 'TRANSACTION_CLOSED');
                }
                return executeStmt(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), db, stmt, __classPrivateFieldGet(this, _Sqlite3Client_intMode, "f"));
            });
            executeStmt(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), db, 'COMMIT', __classPrivateFieldGet(this, _Sqlite3Client_intMode, "f"));
            return resultSets;
        }
        finally {
            if (inTransaction(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), db)) {
                executeStmt(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), db, 'ROLLBACK', __classPrivateFieldGet(this, _Sqlite3Client_intMode, "f"));
            }
        }
    }
    async migrate(stmts) {
        __classPrivateFieldGet(this, _Sqlite3Client_instances, "m", _Sqlite3Client_checkNotClosed).call(this);
        const db = __classPrivateFieldGet(this, _Sqlite3Client_instances, "m", _Sqlite3Client_getDb).call(this);
        try {
            executeStmt(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), db, 'PRAGMA foreign_keys=off', __classPrivateFieldGet(this, _Sqlite3Client_intMode, "f"));
            executeStmt(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), db, transactionModeToBegin('deferred'), __classPrivateFieldGet(this, _Sqlite3Client_intMode, "f"));
            const resultSets = stmts.map((stmt) => {
                if (!inTransaction(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), db)) {
                    throw new LibsqlError('The transaction has been rolled back', 'TRANSACTION_CLOSED');
                }
                return executeStmt(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), db, stmt, __classPrivateFieldGet(this, _Sqlite3Client_intMode, "f"));
            });
            executeStmt(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), db, 'COMMIT', __classPrivateFieldGet(this, _Sqlite3Client_intMode, "f"));
            return resultSets;
        }
        finally {
            if (inTransaction(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), db)) {
                executeStmt(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), db, 'ROLLBACK', __classPrivateFieldGet(this, _Sqlite3Client_intMode, "f"));
            }
            executeStmt(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), db, 'PRAGMA foreign_keys=on', __classPrivateFieldGet(this, _Sqlite3Client_intMode, "f"));
        }
    }
    async transaction(mode = 'write') {
        const db = __classPrivateFieldGet(this, _Sqlite3Client_instances, "m", _Sqlite3Client_getDb).call(this);
        executeStmt(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), db, transactionModeToBegin(mode), __classPrivateFieldGet(this, _Sqlite3Client_intMode, "f"));
        __classPrivateFieldSet(this, _Sqlite3Client_db, null, "f"); // A new connection will be lazily created on next use
        return new Sqlite3Transaction(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), db, __classPrivateFieldGet(this, _Sqlite3Client_intMode, "f"));
    }
    async executeMultiple(sql) {
        __classPrivateFieldGet(this, _Sqlite3Client_instances, "m", _Sqlite3Client_checkNotClosed).call(this);
        const db = __classPrivateFieldGet(this, _Sqlite3Client_instances, "m", _Sqlite3Client_getDb).call(this);
        try {
            return executeMultiple(db, sql);
        }
        finally {
            if (inTransaction(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), db)) {
                executeStmt(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), db, 'ROLLBACK', __classPrivateFieldGet(this, _Sqlite3Client_intMode, "f"));
            }
        }
    }
    async sync() {
        throw new LibsqlError('sync not supported in wasm mode', 'SYNC_NOT_SUPPORTED');
    }
    close() {
        this.closed = true;
        if (__classPrivateFieldGet(this, _Sqlite3Client_db, "f") !== null) {
            __classPrivateFieldGet(this, _Sqlite3Client_db, "f").close();
        }
    }
}
_Sqlite3Client_sqlite3 = new WeakMap(), _Sqlite3Client_path = new WeakMap(), _Sqlite3Client_db = new WeakMap(), _Sqlite3Client_intMode = new WeakMap(), _Sqlite3Client_poolUtil = new WeakMap(), _Sqlite3Client_instances = new WeakSet(), _Sqlite3Client_checkNotClosed = function _Sqlite3Client_checkNotClosed() {
    if (this.closed) {
        throw new LibsqlError('The client is closed', 'CLIENT_CLOSED');
    }
}, _Sqlite3Client_getDb = function _Sqlite3Client_getDb() {
    if (__classPrivateFieldGet(this, _Sqlite3Client_db, "f") === null) {
        __classPrivateFieldSet(this, _Sqlite3Client_db, createDb(__classPrivateFieldGet(this, _Sqlite3Client_sqlite3, "f"), __classPrivateFieldGet(this, _Sqlite3Client_path, "f"), __classPrivateFieldGet(this, _Sqlite3Client_poolUtil, "f")), "f");
    }
    return __classPrivateFieldGet(this, _Sqlite3Client_db, "f");
};
export class Sqlite3Transaction {
    /** @private */
    constructor(sqlite3, database, intMode) {
        _Sqlite3Transaction_instances.add(this);
        _Sqlite3Transaction_sqlite3.set(this, void 0);
        _Sqlite3Transaction_database.set(this, void 0);
        _Sqlite3Transaction_intMode.set(this, void 0);
        __classPrivateFieldSet(this, _Sqlite3Transaction_sqlite3, sqlite3, "f");
        __classPrivateFieldSet(this, _Sqlite3Transaction_database, database, "f");
        __classPrivateFieldSet(this, _Sqlite3Transaction_intMode, intMode, "f");
    }
    async execute(stmt) {
        __classPrivateFieldGet(this, _Sqlite3Transaction_instances, "m", _Sqlite3Transaction_checkNotClosed).call(this);
        return executeStmt(__classPrivateFieldGet(this, _Sqlite3Transaction_sqlite3, "f"), __classPrivateFieldGet(this, _Sqlite3Transaction_database, "f"), stmt, __classPrivateFieldGet(this, _Sqlite3Transaction_intMode, "f"));
    }
    async batch(stmts) {
        return stmts.map((stmt) => {
            __classPrivateFieldGet(this, _Sqlite3Transaction_instances, "m", _Sqlite3Transaction_checkNotClosed).call(this);
            return executeStmt(__classPrivateFieldGet(this, _Sqlite3Transaction_sqlite3, "f"), __classPrivateFieldGet(this, _Sqlite3Transaction_database, "f"), stmt, __classPrivateFieldGet(this, _Sqlite3Transaction_intMode, "f"));
        });
    }
    async executeMultiple(sql) {
        __classPrivateFieldGet(this, _Sqlite3Transaction_instances, "m", _Sqlite3Transaction_checkNotClosed).call(this);
        return executeMultiple(__classPrivateFieldGet(this, _Sqlite3Transaction_database, "f"), sql);
    }
    async rollback() {
        if (!__classPrivateFieldGet(this, _Sqlite3Transaction_database, "f").isOpen()) {
            return;
        }
        __classPrivateFieldGet(this, _Sqlite3Transaction_instances, "m", _Sqlite3Transaction_checkNotClosed).call(this);
        executeStmt(__classPrivateFieldGet(this, _Sqlite3Transaction_sqlite3, "f"), __classPrivateFieldGet(this, _Sqlite3Transaction_database, "f"), 'ROLLBACK', __classPrivateFieldGet(this, _Sqlite3Transaction_intMode, "f"));
    }
    async commit() {
        __classPrivateFieldGet(this, _Sqlite3Transaction_instances, "m", _Sqlite3Transaction_checkNotClosed).call(this);
        executeStmt(__classPrivateFieldGet(this, _Sqlite3Transaction_sqlite3, "f"), __classPrivateFieldGet(this, _Sqlite3Transaction_database, "f"), 'COMMIT', __classPrivateFieldGet(this, _Sqlite3Transaction_intMode, "f"));
    }
    close() {
        if (inTransaction(__classPrivateFieldGet(this, _Sqlite3Transaction_sqlite3, "f"), __classPrivateFieldGet(this, _Sqlite3Transaction_database, "f"))) {
            executeStmt(__classPrivateFieldGet(this, _Sqlite3Transaction_sqlite3, "f"), __classPrivateFieldGet(this, _Sqlite3Transaction_database, "f"), 'ROLLBACK', __classPrivateFieldGet(this, _Sqlite3Transaction_intMode, "f"));
        }
    }
    get closed() {
        return !inTransaction(__classPrivateFieldGet(this, _Sqlite3Transaction_sqlite3, "f"), __classPrivateFieldGet(this, _Sqlite3Transaction_database, "f"));
    }
}
_Sqlite3Transaction_sqlite3 = new WeakMap(), _Sqlite3Transaction_database = new WeakMap(), _Sqlite3Transaction_intMode = new WeakMap(), _Sqlite3Transaction_instances = new WeakSet(), _Sqlite3Transaction_checkNotClosed = function _Sqlite3Transaction_checkNotClosed() {
    if (this.closed) {
        throw new LibsqlError('The transaction is closed', 'TRANSACTION_CLOSED');
    }
};
// const getAffectedTables = (
// 	node: StatementNode | StatementListNode,
// 	set = new Set<string>()
// ): Set<string> => {
// 	if (!node || typeof node !== 'object') return set
// 	if (!(node.type === 'statement')) return set
// 	if (node.variant === 'select')
// 		for (const key in node) {
// 			const child = node[key as keyof StatementNode]
// 			if (Array.isArray(child)) {
// 				child.forEach(n => getAffectedTables(n, set))
// 			} else if (child && typeof child === 'object') {
// 				getAffectedTables(child, set)
// 			}
// 		}
// 	return set
// }
function executeStmt(sqlite3, db, stmt, intMode) {
    let sql;
    let args;
    if (typeof stmt === 'string') {
        sql = stmt;
        args = [];
    }
    else {
        sql = stmt.sql;
        if (Array.isArray(stmt.args)) {
            args = stmt.args.map((value) => valueToSql(value, intMode));
        }
        else {
            args = {};
            for (const name in stmt.args) {
                const argName = name[0] === '@' || name[0] === '$' || name[0] === ':'
                    ? name.substring(1)
                    : name;
                args[argName] = valueToSql(stmt.args[name], intMode);
            }
        }
    }
    // const ast = sqliteParser(sql)
    // const tables = Array.from(getAffectedTables(ast))
    // if (tables.length > 0) {
    // console.log('Affected tables:', tables)
    // }
    let sqlStmt;
    // 1) catch prepare-time errors and map them
    try {
        sqlStmt = db.prepare(sql);
    }
    catch (e) {
        throw mapSqliteError(e);
    }
    try {
        // TODO: sqlStmt.safeIntegers(true);
        let returnsData = sqlStmt.columnCount > 0;
        if (Array.isArray(args)) {
            for (let i = 0; i < args.length; ++i) {
                const value = args[i];
                sqlStmt.bind(i + 1, value);
            }
        }
        else {
            for (const argName in args) {
                const idx = sqlStmt.getParamIndex(argName);
                const value = args[argName];
                sqlStmt.bind(idx, value);
            }
        }
        if (returnsData) {
            let columns = sqlStmt.getColumnNames();
            let columnTypes = [];
            let rows = [];
            for (;;) {
                if (!sqlStmt.step()) {
                    break;
                }
                const values = sqlStmt.get([]);
                const row = rowFromSql(values, columns, intMode);
                rows.push(row);
            }
            rows.forEach((row) => {
                row.id;
            });
            const rowsAffected = 0;
            const lastInsertRowid = undefined;
            return new ResultSetImpl(columns, columnTypes, rows, rowsAffected, lastInsertRowid);
        }
        else {
            sqlStmt.step(); // TODO: check return value
            const rowsAffected = db.changes();
            const lastInsertRowid = sqlite3.capi.sqlite3_last_insert_rowid(db);
            return new ResultSetImpl([], [], [], rowsAffected, lastInsertRowid);
        }
    }
    catch (e) {
        throw mapSqliteError(e);
    }
    finally {
        sqlStmt.finalize();
    }
}
function rowFromSql(sqlRow, columns, intMode) {
    const row = {};
    // make sure that the "length" property is not enumerable
    Object.defineProperty(row, 'length', { value: sqlRow.length });
    for (let i = 0; i < sqlRow.length; ++i) {
        const value = valueFromSql(sqlRow[i], intMode);
        Object.defineProperty(row, i, { value });
        const column = columns[i];
        if (!Object.hasOwn(row, column)) {
            Object.defineProperty(row, column, {
                value,
                enumerable: true,
                configurable: true,
                writable: true,
            });
        }
    }
    return row;
}
function valueFromSql(sqlValue, intMode) {
    if (typeof sqlValue === 'bigint') {
        if (intMode === 'number') {
            if (sqlValue < minSafeBigint || sqlValue > maxSafeBigint) {
                throw new RangeError('Received integer which cannot be safely represented as a JavaScript number');
            }
            return Number(sqlValue);
        }
        else if (intMode === 'bigint') {
            return sqlValue;
        }
        else if (intMode === 'string') {
            return '' + sqlValue;
        }
        else {
            throw new Error('Invalid value for IntMode');
        }
    }
    return sqlValue;
}
const minSafeBigint = -9007199254740991n;
const maxSafeBigint = 9007199254740991n;
function valueToSql(value, intMode) {
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) {
            throw new RangeError('Only finite numbers (not Infinity or NaN) can be passed as arguments');
        }
        return value;
    }
    else if (typeof value === 'bigint') {
        if (value < minInteger || value > maxInteger) {
            throw new RangeError('bigint is too large to be represented as a 64-bit integer and passed as argument');
        }
        return value;
    }
    else if (typeof value === 'boolean') {
        switch (intMode) {
            case 'bigint':
                return value ? 1n : 0n;
            case 'string':
                return value ? '1' : '0';
            default:
                return value ? 1 : 0;
        }
    }
    else if (value instanceof Date) {
        return value.valueOf();
    }
    else if (value === undefined) {
        throw new TypeError('undefined cannot be passed as argument to the database');
    }
    else {
        return value;
    }
}
const minInteger = -9223372036854775808n;
const maxInteger = 9223372036854775807n;
function executeMultiple(db, sql) {
    try {
        db.exec(sql);
    }
    catch (e) {
        throw mapSqliteError(e);
    }
}
function mapSqliteError(e) {
    // TODO: Map to LibsqlError
    return e;
}
