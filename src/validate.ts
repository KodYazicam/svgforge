import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { THEMES } from "./escape.js";
import { prepareManifest, type Manifest } from "./render.js";

interface JsonSchema {
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

const SCHEMA_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "schema", "svgforge.schema.json");

let cachedSchema: JsonSchema | undefined;

function manifestSchema(): JsonSchema {
  cachedSchema ??= JSON.parse(readFileSync(SCHEMA_PATH, "utf8")) as JsonSchema;
  return cachedSchema;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function resolveRef(root: JsonSchema, ref: string): JsonSchema {
  let node: unknown = root;
  for (const part of ref.replace(/^#\//, "").split("/")) {
    if (!isObject(node)) break;
    node = node[part.replaceAll("~1", "/").replaceAll("~0", "~")];
  }
  if (!isObject(node)) throw new Error(`invalid schema reference: ${ref}`);
  return node as JsonSchema;
}

function jsonType(value: unknown): string {
  if (value === null) return "null";
  if (Array.isArray(value)) return "array";
  return typeof value;
}

function validateNode(
  value: unknown,
  schema: JsonSchema,
  path: string,
  root: JsonSchema,
  errors: string[],
): void {
  if (schema.$ref) {
    validateNode(value, resolveRef(root, schema.$ref), path, root, errors);
    return;
  }
  if (schema.type) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actual = jsonType(value);
    if (!allowed.includes(actual)) {
      errors.push(`${path}: expected ${allowed.join(" or ")}, got ${actual}`);
      return;
    }
  }
  if (schema.enum && !schema.enum.some((item) => item === value)) {
    const shown = schema.enum.map((item) => JSON.stringify(item));
    const list = shown.length > 8
      ? `${shown.slice(0, 6).join(", ")}, … (${shown.length} values)`
      : shown.join(", ");
    errors.push(`${path}: ${JSON.stringify(value)} is not one of ${list}`);
  }
  if (isObject(value)) {
    for (const key of schema.required ?? []) {
      if (!Object.hasOwn(value, key)) errors.push(`${path}.${key}: is required`);
    }
    const properties = schema.properties ?? {};
    for (const [key, child] of Object.entries(properties)) {
      if (Object.hasOwn(value, key)) validateNode(value[key], child, `${path}.${key}`, root, errors);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.hasOwn(properties, key)) errors.push(`${path}.${key}: unknown property`);
      }
    } else if (isObject(schema.additionalProperties)) {
      for (const key of Object.keys(value)) {
        if (!Object.hasOwn(properties, key)) {
          validateNode(value[key], schema.additionalProperties as JsonSchema, `${path}.${key}`, root, errors);
        }
      }
    }
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => validateNode(item, schema.items as JsonSchema, `${path}[${index}]`, root, errors));
  }
  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${path}: must be at least ${schema.minLength} character(s)`);
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      const hint = schema.description ? ` (${schema.description})` : "";
      errors.push(`${path}: ${JSON.stringify(value)} does not match the required pattern${hint}`);
    }
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(`${path}: must be >= ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(`${path}: must be <= ${schema.maximum}`);
    }
    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) {
      errors.push(`${path}: must be > ${schema.exclusiveMinimum}`);
    }
  }
}

export interface ValidationSummary {
  cards: number;
  types: string[];
  outputs: string[];
}

/**
 * Check a manifest against the published JSON schema, then reuse the same
 * path/type/duplicate checks as `renderManifest`. Writes nothing.
 */
export function validateManifest(manifest: Manifest): ValidationSummary {
  // Path, type, and duplicate checks run first so their messages stay specific
  // ("refusing path traversal", "duplicate output path", "unknown type").
  const prepared = prepareManifest(manifest);

  const schema = manifestSchema();
  const errors: string[] = [];
  validateNode(manifest, schema, "manifest", schema, errors);
  if (errors.length > 0) {
    throw new Error(`manifest is invalid:\n${errors.map((error) => `  - ${error}`).join("\n")}`);
  }

  if (manifest.theme !== undefined && !Object.hasOwn(THEMES, manifest.theme)) {
    throw new Error(`manifest.theme: unknown theme "${manifest.theme}" (see \`svgforge themes\`)`);
  }
  prepared.forEach((card, index) => {
    const theme = card.resolved.theme;
    if (theme !== undefined && !Object.hasOwn(THEMES, theme)) {
      throw new Error(`manifest.cards[${index}].theme: unknown theme "${theme}" (see \`svgforge themes\`)`);
    }
  });

  return {
    cards: prepared.length,
    types: [...new Set(prepared.map((card) => card.type))],
    outputs: prepared.map((card) => card.file),
  };
}
