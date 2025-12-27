#!/usr/bin/env npx tsx
import * as fs from 'fs';
import * as path from 'path';

const JSWASM_DIR = 'sqlite-wasm/jswasm';
const SQLITE3_MJS = path.join(JSWASM_DIR, 'sqlite3.mjs');
const INDEX_DTS = 'index.d.ts';

function assertLocalBuildExists(): void {
  if (!fs.existsSync(JSWASM_DIR)) {
    throw new Error(
      `Local SQLite WASM build not found at ${JSWASM_DIR}. ` +
        'This package requires a custom SQLite build with extensions. ' +
        'Please build SQLite WASM locally first.',
    );
  }

  const requiredFiles = ['sqlite3.mjs', 'sqlite3.wasm'];
  for (const file of requiredFiles) {
    const filePath = path.join(JSWASM_DIR, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required file ${filePath} not found in local build.`);
    }
  }

  console.log('✓ Local SQLite WASM build verified');
}

function patchLocateFile(content: string): string {
  const target = "Module['locateFile'] = function(path, prefix) {";
  const replacement =
    "if (!Module['locateFile']) {\n    Module['locateFile'] = function(path, prefix) {";

  if (!content.includes(target)) {
    console.warn('⚠ Could not find locateFile assignment to patch');
    return content;
  }

  content = content.replace(target, replacement);

  // Close the if block after the function
  const bindTarget = '.bind(sIMS);';
  const bindReplacement = '.bind(sIMS);\n  }';
  content = content.replace(bindTarget, bindReplacement);

  console.log('✓ Patched locateFile override');
  return content;
}

function patchOpfsProxyUrl(content: string): string {
  const replacement =
    'installOpfsVfs.defaultProxyUri = Module[\'opfsProxyUrl\'] || "sqlite3-opfs-async-proxy.js";';

  // Try different variations of the target string
  const targets = [
    'installOpfsVfs.defaultProxyUri =\n  "sqlite3-opfs-async-proxy.js";',
    'installOpfsVfs.defaultProxyUri = "sqlite3-opfs-async-proxy.js";',
  ];

  for (const target of targets) {
    if (content.includes(target)) {
      console.log('✓ Patched opfsProxyUrl override');
      return content.replace(target, replacement);
    }
  }

  // Fallback: regex for whitespace variations
  const regex =
    /installOpfsVfs\.defaultProxyUri\s*=\s*["']sqlite3-opfs-async-proxy\.js["'];/;
  if (regex.test(content)) {
    console.log('✓ Patched opfsProxyUrl override (regex match)');
    return content.replace(regex, replacement);
  }

  console.warn('⚠ Could not find opfsProxyUrl assignment to patch');
  return content;
}

function patchSqlite3Mjs(): void {
  if (!fs.existsSync(SQLITE3_MJS)) {
    console.warn(`⚠ ${SQLITE3_MJS} not found, skipping patches`);
    return;
  }

  let content = fs.readFileSync(SQLITE3_MJS, 'utf8');
  content = patchLocateFile(content);
  content = patchOpfsProxyUrl(content);
  fs.writeFileSync(SQLITE3_MJS, content);
}

function patchTypeDefinitions(): void {
  if (!fs.existsSync(INDEX_DTS)) {
    console.warn(`⚠ ${INDEX_DTS} not found, skipping type patches`);
    return;
  }

  let content = fs.readFileSync(INDEX_DTS, 'utf8');

  // Skip if already patched
  if (content.includes('opfsProxyUrl?: string')) {
    console.log('✓ Type definitions already patched');
    return;
  }

  const target = `declare type InitOptions = {
  locateFile?: (path: string, prefix: string) => string;
  print?: (msg: string) => void;
  printErr?: (msg: string) => void;
};`;

  const replacement = `declare type InitOptions = {
  locateFile?: (path: string, prefix: string) => string;
  print?: (msg: string) => void;
  printErr?: (msg: string) => void;
  /** Custom option (patched): URL to the OPFS async proxy worker script */
  opfsProxyUrl?: string;
};`;

  if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(INDEX_DTS, content);
    console.log('✓ Patched type definitions for opfsProxyUrl');
  } else {
    console.warn('⚠ Could not find InitOptions to patch');
  }
}

async function main(): Promise<void> {
  console.log('SQLite WASM post-install patches\n');

  assertLocalBuildExists();
  patchSqlite3Mjs();
  patchTypeDefinitions();

  console.log('\n✓ All patches applied successfully');
}

main().catch((err) => {
  console.error('✗ Patch failed:', err.message);
  process.exit(1);
});
