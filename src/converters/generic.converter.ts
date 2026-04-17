/**
 * Generic converter — handles object types that are pure metadata (no source files).
 *
 * Strips TADIR and system fields, passes all remaining tables through as XML.
 * Used for: SICF, SMIM, NONT, RONT, G4BA, SCO2, SIA1, SIA6, SIA7, NSPC, SUSH, UIAD, WAPA
 */

import type { AbapgitObject, GctsObjectData, ValidationResult } from '../core/types.js';
import type { IObjectConverter } from './base-converter.js';
import { buildAbapGitXml } from '../formats/abapgit/xml.js';
import { OMIT_TABLES } from '../field-maps/common-strip-fields.js';
import { isEmpty } from './base-converter.js';

/** Fields to strip from all table rows in generic conversion */
const GENERIC_STRIP_FIELDS = new Set([
  'AS4USER', 'AS4DATE', 'AS4TIME', 'AS4LOCAL', 'AS4VERS', 'ACTFLAG',
]);

export class GenericConverter implements IObjectConverter {
  readonly objectType: string;
  readonly description: string;
  readonly serializerClass: string;

  constructor(objectType: string, description: string) {
    this.objectType = objectType;
    this.description = description;
    this.serializerClass = `LCL_OBJECT_${objectType}`;
  }

  toAbapGit(gctsObject: GctsObjectData): AbapgitObject {
    const values: Record<string, unknown> = {};

    for (const block of gctsObject.tables) {
      // Skip system tables
      if (OMIT_TABLES.has(block.table)) continue;

      if (block.data.length === 1) {
        // Single row — serialize as a direct object
        values[block.table] = this.stripRow(block.data[0]);
      } else if (block.data.length > 1) {
        // Multiple rows — serialize as an array
        values[`${block.table}_TABLE`] = block.data.map(row => this.stripRow(row));
      }
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
    const nonTadirTables = gctsObject.tables.filter(t => !OMIT_TABLES.has(t.table));
    if (nonTadirTables.length === 0) {
      return { valid: false, errors: ['No data tables found (only TADIR)'], warnings: [] };
    }
    return { valid: true, errors: [], warnings: [] };
  }

  private stripRow(row: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (GENERIC_STRIP_FIELDS.has(key)) continue;
      if (isEmpty(value)) continue;
      result[key] = value;
    }
    return result;
  }
}

/** Create generic converters for all remaining object types */
export function createGenericConverters(): GenericConverter[] {
  return [
    new GenericConverter('SICF', 'ICF Services'),
    new GenericConverter('SMIM', 'MIME Repository Objects'),
    new GenericConverter('NONT', 'Node Object Types'),
    new GenericConverter('RONT', 'Root Object Node Types'),
    new GenericConverter('G4BA', 'OData V4 Applications'),
    new GenericConverter('SCO2', 'Scope Assignments'),
    new GenericConverter('SIA1', 'Business Catalog Definitions'),
    new GenericConverter('SIA6', 'Extension Application Definitions'),
    new GenericConverter('SIA7', 'Business Catalog App Assignments'),
    new GenericConverter('NSPC', 'Namespaces'),
    new GenericConverter('SUSH', 'Authorization Objects'),
    new GenericConverter('UIAD', 'UI5 Application Definitions'),
    new GenericConverter('WAPA', 'Web Applications'),
  ];
}
