import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { THEMES } from "./escape.js";
import { ManifestError, prepareManifest, type Manifest, type PreparedCard } from "./render.js";
import { loadSchema, type JsonSchema } from "./schema.js";

export interface ValidationIssue {
  path: string;
  message: string;
}

export interface ValidationReport {
  ok: boolean;
  cards: number;
  types: string[];
  outputs: string[];
  errors: ValidationIssue[];
}

export interface ValidationSummary {
  cards: number;
  types: string[];
  outputs: string[];
}

const SCHEMA_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "schema", "svgforge.schema.json");

function manifestSchema(): JsonSchema {
  return loadSchema(SCHEMA_PATH);
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
  errors: ValidationIssue[],
): void {
  if (schema.$ref) {
    validateNode(value, resolveRef(root, schema.$ref), path, root, errors);
    return;
  }
  if (schema.type) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actual = jsonType(value);
    if (!allowed.includes(actual)) {
      errors.push({ path, message: `expected ${allowed.join(" or ")}, got ${actual}` });
      return;
    }
  }
  if (schema.enum && !schema.enum.some((item) => item === value)) {
    const shown = schema.enum.map((item) => JSON.stringify(item));
    const list = shown.length > 8
      ? `${shown.slice(0, 6).join(", ")}, … (${shown.length} values)`
      : shown.join(", ");
    errors.push({ path, message: `${JSON.stringify(value)} is not one of ${list}` });
  }
  if (isObject(value)) {
    for (const key of schema.required ?? []) {
      if (!Object.hasOwn(value, key)) errors.push({ path: `${path}.${key}`, message: "is required" });
    }
    const properties = schema.properties ?? {};
    for (const [key, child] of Object.entries(properties)) {
      if (Object.hasOwn(value, key)) validateNode(value[key], child, `${path}.${key}`, root, errors);
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!Object.hasOwn(properties, key)) errors.push({ path: `${path}.${key}`, message: "unknown property" });
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
      errors.push({ path, message: `must be at least ${schema.minLength} character(s)` });
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      const hint = schema.description ? ` (${schema.description})` : "";
      errors.push({ path, message: `${JSON.stringify(value)} does not match the required pattern${hint}` });
    }
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({ path, message: `must be >= ${schema.minimum}` });
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push({ path, message: `must be <= ${schema.maximum}` });
    }
    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) {
      errors.push({ path, message: `must be > ${schema.exclusiveMinimum}` });
    }
  }
}

function report(prepared: PreparedCard[], errors: ValidationIssue[]): ValidationReport {
  return {
    ok: errors.length === 0,
    cards: prepared.length,
    types: [...new Set(prepared.map((card) => card.type))],
    outputs: prepared.map((card) => card.file),
    errors,
  };
}

/**
 * Check a manifest against the published JSON schema, then reuse the same
 * path/type/duplicate checks as `renderManifest`. Never throws for manifest
 * problems; returns structured issues instead. Writes nothing.
 */
export function inspectManifest(manifest: Manifest): ValidationReport {
  let prepared: PreparedCard[];
  try {
    // Run structural checks first so path/type/duplicate messages stay specific.
    prepared = prepareManifest(manifest);
  } catch (error) {
    if (error instanceof ManifestError) {
      const cards = Array.isArray(manifest?.cards) ? manifest.cards.length : 0;
      return { ok: false, cards, types: [], outputs: [], errors: [{ path: error.path, message: error.message }] };
    }
    throw error;
  }

  const schema = manifestSchema();
  const errors: ValidationIssue[] = [];
  validateNode(manifest, schema, "manifest", schema, errors);
  if (errors.length > 0) return report(prepared, errors);

  if (manifest.theme !== undefined && !Object.hasOwn(THEMES, manifest.theme)) {
    errors.push({ path: "manifest.theme", message: `unknown theme "${manifest.theme}" (see \`svgforge themes\`)` });
  }
  prepared.forEach((card, index) => {
    const theme = card.resolved.theme;
    if (theme !== undefined && !Object.hasOwn(THEMES, theme)) {
      errors.push({ path: `manifest.cards[${index}].theme`, message: `unknown theme "${theme}" (see \`svgforge themes\`)` });
    }
  });
  return report(prepared, errors);
}

export function formatValidationErrors(errors: ValidationIssue[]): string {
  if (errors.length === 1) return `${errors[0].path}: ${errors[0].message}`;
  return `manifest is invalid:\n${errors.map((error) => `  - ${error.path}: ${error.message}`).join("\n")}`;
}

export function validateManifest(manifest: Manifest): ValidationSummary {
  const result = inspectManifest(manifest);
  if (!result.ok) throw new Error(formatValidationErrors(result.errors));
  return { cards: result.cards, types: result.types, outputs: result.outputs };
}
