/**
 * Core sanitization logic for gCTS objects.
 *
 * D10 and BTP ABAP Environment use IDENTICAL gCTS schemas (confirmed by
 * comparing zevent-ref-btp nametabs with D10 nametabs — both have 55 DD02L
 * fields, 31 DD03L fields, etc.). NO fields are stripped.
 *
 * The only normalization needed is in the TADIR metadata:
 *   CPROJECT: " L" → " S" (SAP Cloud project type)
 *   CRELEASE: "" → "100" (release version)
 *   COMPONENT: "" → software component package name
 */

import type { GctsObjectData, GctsTableBlock } from '../core/types.js';
import type { TadirNormalization } from './field-blocklist.js';

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

/**
 * Normalize TADIR fields in a single table block for BTP compatibility.
 * All other tables pass through completely unchanged.
 * Returns a new block; the original is not mutated.
 */
export function sanitizeTableBlock(
  block: GctsTableBlock,
  normalization: TadirNormalization,
): GctsTableBlock {
  if (block.table !== 'TADIR') {
    return block;
  }

  const cleanData = block.data.map(row => {
    const cleanRow = { ...row };
    cleanRow.CPROJECT = normalization.cproject;
    cleanRow.CRELEASE = normalization.crelease;
    if (normalization.component) {
      cleanRow.COMPONENT = normalization.component;
    }
    return cleanRow;
  });

  return { table: block.table, data: cleanData };
}

/**
 * Sanitize all table blocks in an object — normalizes TADIR fields,
 * passes everything else through unchanged.
 */
export function sanitizeObject(
  obj: GctsObjectData,
  normalization: TadirNormalization,
): GctsObjectData {
  return {
    objectType: obj.objectType,
    objectName: obj.objectName,
    tables: obj.tables.map(block => sanitizeTableBlock(block, normalization)),
    sourceFiles: obj.sourceFiles,
  };
}

/**
 * Nametabs pass through completely unchanged — D10 and BTP have identical schemas.
 */
export function sanitizeNametab(nametab: NametabDefinition): NametabDefinition {
  return nametab;
}

// Legacy exports for backward compatibility
export function sanitizeObjectData(
  tables: GctsTableBlock[],
  normalization: TadirNormalization,
): GctsTableBlock[] {
  return tables.map(block => sanitizeTableBlock(block, normalization));
}

export function validateConsistency(): string[] {
  return [];
}
