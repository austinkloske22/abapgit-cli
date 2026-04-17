/**
 * TABL converter — Database tables.
 *
 * Converts between gCTS format (DD02L/DD02T/DD03L/DD03T/DD09L raw table dumps)
 * and abapGit format (DD02V/DD09L/DD03P_TABLE portable structures).
 *
 * This is the most complex converter because it transforms raw DDIC table rows
 * into abapGit's view-based XML structure, stripping system-specific fields
 * like QUOTA_MAX_FIELDS, timestamps, and activation flags.
 */

import type { AbapgitObject, GctsObjectData, ValidationResult } from '../core/types.js';
import { type IObjectConverter, applyFieldMap } from './base-converter.js';
import { getFirstRow, getRows } from '../formats/gcts/reader.js';
import { buildAbapGitXml } from '../formats/abapgit/xml.js';
import { DD02L_TO_DD02V } from '../field-maps/dd02l-to-dd02v.js';
import { DD03L_TO_DD03P } from '../field-maps/dd03l-to-dd03p.js';

/** Fields to keep from DD09L (technical settings) */
const DD09L_KEEP_FIELDS = [
  'TABKAT', 'TABART', 'PUFFERUNG', 'SCHFELDANZ', 'PROTOKOLL',
  'SPEICHPUFF', 'TRANSPFLAG', 'UEBERSETZ', 'BUFALLOW',
  'ROWORCOLST', 'SHARINGTYPE', 'LOAD_UNIT', 'ALLOWED_FOR_AMDP_WRITE',
];

export class TablConverter implements IObjectConverter {
  readonly objectType = 'TABL';
  readonly description = 'Database Tables';
  readonly serializerClass = 'LCL_OBJECT_TABL';

  toAbapGit(gctsObject: GctsObjectData): AbapgitObject {
    // Build DD02V from DD02L + DD02T
    const dd02v = this.buildDD02V(gctsObject);

    // Build DD09L (stripped)
    const dd09l = this.buildDD09L(gctsObject);

    // Build DD03P_TABLE from DD03L
    const dd03pTable = this.buildDD03PTable(gctsObject);

    // Assemble the values object
    const values: Record<string, unknown> = { DD02V: dd02v };

    if (dd09l && Object.keys(dd09l).length > 0) {
      values.DD09L = dd09l;
    }

    if (dd03pTable.length > 0) {
      values.DD03P_TABLE = dd03pTable;
    }

    const xmlContent = buildAbapGitXml(this.serializerClass, values);

    return {
      objectType: this.objectType,
      objectName: gctsObject.objectName,
      xmlContent,
      additionalFiles: [],
    };
  }

  validateGcts(gctsObject: GctsObjectData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!getFirstRow(gctsObject, 'DD02L')) {
      errors.push('Missing DD02L table (table header)');
    }
    if (!getFirstRow(gctsObject, 'DD03L')) {
      warnings.push('Missing DD03L table (field definitions)');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private buildDD02V(obj: GctsObjectData): Record<string, unknown> {
    const dd02l = getFirstRow(obj, 'DD02L');
    if (!dd02l) return {};

    // Start with field-mapped DD02L
    const dd02v = applyFieldMap(dd02l, DD02L_TO_DD02V);

    // Merge DDTEXT and DDLANGUAGE from DD02T
    const dd02tRows = getRows(obj, 'DD02T');
    const englishText = dd02tRows.find(r => r.DDLANGUAGE === 'E');
    if (englishText) {
      dd02v.DDLANGUAGE = 'E';
      if (englishText.DDTEXT) {
        dd02v.DDTEXT = englishText.DDTEXT;
      }
    }

    return dd02v;
  }

  private buildDD09L(obj: GctsObjectData): Record<string, unknown> | null {
    const dd09l = getFirstRow(obj, 'DD09L');
    if (!dd09l) return null;

    const result: Record<string, unknown> = {};
    for (const field of DD09L_KEEP_FIELDS) {
      const value = dd09l[field];
      if (value !== undefined && value !== null && value !== '' && value !== 0 && value !== '0') {
        result[field] = value;
      }
    }

    return result;
  }

  private buildDD03PTable(obj: GctsObjectData): Record<string, unknown>[] {
    const dd03lRows = getRows(obj, 'DD03L');

    // Sort by POSITION
    const sorted = [...dd03lRows].sort((a, b) => {
      const posA = Number(a.POSITION ?? 0);
      const posB = Number(b.POSITION ?? 0);
      return posA - posB;
    });

    return sorted.map(row => applyFieldMap(row, DD03L_TO_DD03P));
  }
}
