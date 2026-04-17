/**
 * Core sanitization logic for gCTS objects.
 *
 * Strips D10-specific fields from both object data (.asx.json table blocks)
 * and nametab schema definitions so that BTP ABAP Environment can import them.
 */

import type { GctsObjectData, GctsTableBlock } from '../core/types.js';
import type { FieldBlocklist } from './field-blocklist.js';
import { getBlockedFields } from './field-blocklist.js';

/** A single field definition in a nametab schema. */
export interface NametabField {
  NAME: string;
  KEY: string;
  TYPE: string;
  LENGTH: number;
  DECIMALS: number;
}

/** Nametab properties block. */
export interface NametabProperties {
  CLIENTDEPENDENCY: string;
  DELIVERYCLASS: string;
  TABART: string;
  TABFORM: string;
  REFNAME: string;
}

/** A nametab definition as read from .gctsmetadata/nametabs/{TABLE}.asx.json */
export interface NametabDefinition {
  table: string;
  nametab: NametabField[];
  properties: NametabProperties[];
}

/** Result of sanitizing a complete gCTS repository. */
export interface SanitizeResult {
  objects: GctsObjectData[];
  nametabs: NametabDefinition[];
  strippedFields: Map<string, string[]>; // table → field names stripped
}

/**
 * Fields that must be normalized to specific values for BTP compatibility.
 * AS4LOCAL must be "A" (active) — BTP rejects "L" (locked) and "N" (not activated).
 */
const VALUE_NORMALIZATIONS: Record<string, Record<string, unknown>> = {
  AS4LOCAL: { value: 'A' },  // Must be Active for BTP import
};

/**
 * Strip blocklisted fields and normalize values in a single table block's data rows.
 * Returns a new block; the original is not mutated.
 */
export function sanitizeTableBlock(
  block: GctsTableBlock,
  blocklist: FieldBlocklist,
): GctsTableBlock {
  const blocked = getBlockedFields(blocklist, block.table);

  const cleanData = block.data.map(row => {
    const cleanRow: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (blocked.has(key)) continue;

      // Normalize specific field values for BTP compatibility
      const normalization = VALUE_NORMALIZATIONS[key];
      if (normalization && value !== undefined && value !== null && value !== '') {
        cleanRow[key] = normalization.value;
      } else {
        cleanRow[key] = value;
      }
    }
    return cleanRow;
  });

  return { table: block.table, data: cleanData };
}

/**
 * Sanitize all table blocks in an object's data.
 * Returns new blocks; the originals are not mutated.
 */
export function sanitizeObjectData(
  tables: GctsTableBlock[],
  blocklist: FieldBlocklist,
): GctsTableBlock[] {
  return tables.map(block => sanitizeTableBlock(block, blocklist));
}

/**
 * Strip blocklisted fields from a nametab schema definition.
 * Returns a new definition; the original is not mutated.
 */
export function sanitizeNametab(
  nametab: NametabDefinition,
  blocklist: FieldBlocklist,
): NametabDefinition {
  const blocked = getBlockedFields(blocklist, nametab.table);
  if (blocked.size === 0) {
    return nametab;
  }

  const cleanFields = nametab.nametab.filter(field => !blocked.has(field.NAME));

  return {
    table: nametab.table,
    nametab: cleanFields,
    properties: nametab.properties,
  };
}

/**
 * Sanitize a full gCTS object — strips blocklisted fields from all table blocks
 * and passes source files through unchanged.
 */
export function sanitizeObject(
  obj: GctsObjectData,
  blocklist: FieldBlocklist,
): GctsObjectData {
  return {
    objectType: obj.objectType,
    objectName: obj.objectName,
    tables: sanitizeObjectData(obj.tables, blocklist),
    sourceFiles: obj.sourceFiles, // pass through unchanged
  };
}

/**
 * Validate that a nametab and its corresponding object data are consistent
 * after sanitization: every field in the nametab should appear as a key
 * in the object data rows, and vice versa.
 *
 * Returns a list of warnings (not errors — some objects may legitimately
 * have nametabs with fields that don't appear in every object's data).
 */
export function validateConsistency(
  obj: GctsObjectData,
  nametabs: NametabDefinition[],
): string[] {
  const warnings: string[] = [];

  for (const nametab of nametabs) {
    const block = obj.tables.find(t => t.table === nametab.table);
    if (!block || block.data.length === 0) {
      continue;
    }

    const nametabFieldNames = new Set(nametab.nametab.map(f => f.NAME));
    const dataFieldNames = new Set(Object.keys(block.data[0]));

    // Fields in data but not in nametab
    for (const field of dataFieldNames) {
      if (!nametabFieldNames.has(field)) {
        warnings.push(
          `${obj.objectType} ${obj.objectName}: field "${field}" in ${block.table} data but not in nametab`,
        );
      }
    }

    // Fields in nametab but not in data
    for (const field of nametabFieldNames) {
      if (!dataFieldNames.has(field)) {
        warnings.push(
          `${obj.objectType} ${obj.objectName}: field "${field}" in ${block.table} nametab but not in data`,
        );
      }
    }
  }

  return warnings;
}
