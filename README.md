# SQLite Wasm (Extended Fork)

SQLite Wasm with **sqlite-vec** and **soundex** extensions, plus a SolidJS
interactive demo.

## What's Different in This Fork?

This fork includes:

- **sqlite-vec** - Vector search extension for embeddings and similarity search
- **soundex** - Phonetic matching function for fuzzy name searches
- **FTS5** - Full-text search (enabled by default)
- **Interactive Demo** - SolidJS-powered fiddle with Main Thread, Worker, and
  OPFS modes

## Installation

Install from GitHub:

```bash
npm install github:your-user/sqlite-wasm
```

## Running the Demo

```bash
npm install
npm run demo
```

This starts a Vite dev server with an interactive SQL fiddle featuring:

- **Main Thread** - Run queries directly in the browser's main thread
- **Worker** - Run queries in a Web Worker (non-blocking)
- **OPFS** - Use Origin Private File System for persistent storage

Each tab includes preset queries demonstrating FTS5, sqlite-vec vectors, JSON
functions, and soundex.

## Usage

### Basic Example

```js
import sqlite3InitModule from 'sqlite-wasm';

const sqlite3 = await sqlite3InitModule();
const db = new sqlite3.oo1.DB(':memory:');

// Use sqlite-vec for vector search
db.exec(`
  CREATE VIRTUAL TABLE embeddings USING vec0(vector float[4]);
  INSERT INTO embeddings(rowid, vector) VALUES (1, '[1.0, 0.0, 0.0, 0.0]');
`);

// Use soundex for fuzzy matching
db.exec(`SELECT soundex('Robert'), soundex('Rupert');`);

// Use FTS5 for full-text search
db.exec(`
  CREATE VIRTUAL TABLE docs USING fts5(title, body);
  INSERT INTO docs VALUES ('Hello', 'World');
  SELECT * FROM docs WHERE docs MATCH 'hello';
`);
```

### With OPFS Persistence

```js
import { sqlite3Worker1Promiser } from 'sqlite-wasm';

const promiser = await new Promise((resolve) => {
  const _promiser = sqlite3Worker1Promiser({
    onready: () => resolve(_promiser),
  });
});

await promiser('open', { filename: 'file:mydb.sqlite3?vfs=opfs' });
```

> **Note:** OPFS requires these headers on your server:
>
> - `Cross-Origin-Opener-Policy: same-origin`
> - `Cross-Origin-Embedder-Policy: require-corp`

## Vite Configuration

```js
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  optimizeDeps: {
    exclude: ['sqlite-wasm'],
  },
});
```

## License

Apache 2.0.

## Acknowledgements

Based on [SQLite Wasm](https://sqlite.org/wasm) by the SQLite team.
