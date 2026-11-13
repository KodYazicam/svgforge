import { readFileSync, statSync } from "node:fs";

export interface JsonSchema {
  $ref?: string;
  type?: string | string[];
  enum?: unknown[];
  required?: string[];
  properties?: Record<string, JsonSchema>;
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchema;
  pattern?: string;
  minLength?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  description?: string;
  $defs?: Record<string, JsonSchema>;
}

export const SCHEMA_CACHE_LIMIT = 4;

interface SchemaCacheEntry {
  mtimeNs: bigint;
  schema: JsonSchema;
}

const schemaCache = new Map<string, SchemaCacheEntry>();

/**
 * Parse a JSON schema once per path until its mtime changes. Used for the
 * published manifest schema, but the path is explicit so tests and other
 * callers can reuse the same bounded cache.
 */
export function loadSchema(path: string): JsonSchema {
  const mtimeNs = statSync(path, { bigint: true }).mtimeNs;
  const cached = schemaCache.get(path);
  if (cached && cached.mtimeNs === mtimeNs) {
    // Refresh insertion order so the least recently used entry is evicted.
    schemaCache.delete(path);
    schemaCache.set(path, cached);
    return cached.schema;
  }

  const schema = JSON.parse(readFileSync(path, "utf8")) as JsonSchema;
  schemaCache.delete(path);
  schemaCache.set(path, { mtimeNs, schema });
  while (schemaCache.size > SCHEMA_CACHE_LIMIT) {
    const oldest = schemaCache.keys().next().value;
    if (oldest === undefined) break;
    schemaCache.delete(oldest);
  }
  return schema;
}

export function clearSchemaCache(): void {
  schemaCache.clear();
}

export function schemaCacheSize(): number {
  return schemaCache.size;
}
