// src/worker/types.ts
import type { Config as BaseConfig, InArgs } from './api.js';
import type { ExpandedConfig as _ExpandedConfig } from './config.js';
import type sqlite3InitModule from '../index.mjs';

export type Sqlite3Method = 'get' | 'all' | 'run' | 'values';

export type DriverQueryResult = { rows: unknown[][] };
export type DriverQuery = {
  sql: string;
  params?: InArgs;
  method?: Sqlite3Method;
};

export type Sqlite3ClientType = Awaited<ReturnType<typeof sqlite3InitModule>>;
export type PoolUtil = Awaited<
  ReturnType<Sqlite3ClientType['installOpfsSAHPoolVfs']>
>;
export type Config = BaseConfig & { poolUtil?: PoolUtil };

export type ExpandedConfig = _ExpandedConfig & {
  poolUtil?: PoolUtil;
};
