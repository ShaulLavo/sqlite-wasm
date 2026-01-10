/** Error thrown by the client. */
export class LibsqlError extends Error {
    constructor(message, code, rawCode, cause) {
        if (code !== undefined) {
            message = `${code}: ${message}`;
        }
        super(message, { cause });
        this.code = code;
        this.rawCode = rawCode;
        this.name = 'LibsqlError';
    }
}
/** Error thrown by the client during batch operations. */
export class LibsqlBatchError extends LibsqlError {
    constructor(message, statementIndex, code, rawCode, cause) {
        super(message, code, rawCode, cause);
        this.statementIndex = statementIndex;
        this.name = 'LibsqlBatchError';
    }
}
