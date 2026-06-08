import sql from "mssql";
import { getPool } from "./dbPool";

interface CacheEntry {
  value: string;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const TTL_MS = 5 * 60 * 1000; // 5-minute cache to avoid hitting DB on every request

export async function getAPIConfigs(keys: string[]): Promise<Record<string, string>> {
  const now = Date.now();

  const missing = keys.filter((k) => {
    const entry = cache.get(k);
    return !entry || entry.expiresAt <= now;
  });

  if (missing.length > 0) {
    const pool = await getPool();
    const request = pool.request();
    missing.forEach((k, i) => request.input(`k${i}`, sql.NVarChar(100), k));
    const inList = missing.map((_, i) => `@k${i}`).join(", ");
    const result = await request.query<{ ConfigKey: string; ConfigValue: string }>(
      `SELECT ConfigKey, ConfigValue FROM dbo.tbl_APIConfig WHERE ConfigKey IN (${inList}) AND IsActive = 1`
    );
    const expiresAt = Date.now() + TTL_MS;
    for (const row of result.recordset) {
      cache.set(row.ConfigKey, { value: row.ConfigValue, expiresAt });
    }
  }

  const out: Record<string, string> = {};
  for (const k of keys) {
    const entry = cache.get(k);
    if (!entry || entry.expiresAt <= now) {
      throw new Error(`API config key '${k}' not found or inactive in tbl_APIConfig`);
    }
    out[k] = entry.value;
  }
  return out;
}
