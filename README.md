# SQLite Wasm (Extended Fork)

SQLite Wasm with **sqlite-vec** and **soundex** extensions, plus a SolidJS
interactive demo.

## What's Different in This Fork?

This fork includes:

- **Vector Search (sqlite-vec)** - High-performance vector similarity search for
  AI and embeddings
- **Fuzzy Matching & Phonetics (sqlean-fuzzy)** - Comprehensive suite of fuzzy
  search tools including Levenshtein, Jaro-Winkler, and multiple phonetic
  algorithms
- **Regular Expressions (sqlean-regexp)** - Modern PCRE2-compatible regular
  expression support
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
functions, and fuzzy matching.

## Detailed Features

### 1. Vector Search (sqlite-vec)

Adds high-performance vector similarity search for AI/Embeddings.

- **Virtual Table:** `vec0` (e.g.,
  `CREATE VIRTUAL TABLE embeddings USING vec0(vector float[1536])`)
- **Key Functions:**
  - `vec_version()` - Returns the sqlite-vec version.
  - `vec_distance_cosine(a, b)` - Cosine similarity.
  - `vec_distance_l2(a, b)` - L2 (Euclidean) distance.
  - `vec_normalize(v)` - Normalizes a vector.

### 2. Fuzzy Matching & Phonetics (sqlean-fuzzy)

A powerful suite of fuzzy search and phonetic tools.

- **Distance Algorithms:**
  - `levenshtein(a, b)`, `fuzzy_leven` - Standard edit distance.
  - `jaro_winkler(a, b)`, `fuzzy_jarowin` - Similarity score (0.0 to 1.0).
  - `dlevenshtein(a, b)`, `fuzzy_damlev` - Damerau-Levenshtein distance.
  - `hamming(a, b)`, `fuzzy_hamming` - Position-based differences.
- **Phonetic Algorithms:**
  - `soundex(s)` - Standard phonetic coding.
  - `rsoundex(s)` - Refined Soundex.
  - `phonetic_hash(s)` - Phonetic representation.
  - `caverphone(s)` - Caverphone algorithm for names.
- **Utilities:**
  - `translit(s)` - Converts non-ASCII Roman characters (é -> e).

### 3. Regular Expressions (sqlean-regexp)

Full PCRE2 (Perl Compatible Regular Expressions) support.

- **Functions:**
  - `regexp_like(source, pattern)` - Returns 1 if match found.
  - `regexp_substr(source, pattern)` - Returns matching substring.
  - `regexp_replace(source, pattern, replacement)` - Replaces all matches.
  - `regexp_capture(source, pattern, group_index)` - Captures a specific group.
  - `REGEXP` operator - Enables `WHERE column REGEXP 'pattern'` syntax.

### 4. Full-Text Search (FTS5)

Standard SQLite FTS5 module for high-performance keyword searching across
documents.

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
