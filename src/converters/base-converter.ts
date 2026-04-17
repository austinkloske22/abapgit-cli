/**
 * Base converter utilities and interface.
 */

import type {
  AbapgitObject,
  FieldMapEntry,
  GctsObjectData,
  ValidationResult,
} from '../core/types.js';

/** Interface that every object type converter must implement */
export interface IObjectConverter {
  readonly objectType: string;
  readonly description: string;
  readonly serializerClass: string;
  toAbapGit(gctsObject: GctsObjectData): AbapgitObject;
  validateGcts(gctsObject: GctsObjectData): ValidationResult;
}

/** Apply a field map to transform a source row into a target row */
export function applyFieldMap(
  sourceRow: Record<string, unknown>,
  fieldMap: FieldMapEntry[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const entry of fieldMap) {
    let value = sourceRow[entry.source];

    if (entry.transform) {
      value = entry.transform(value);
    }

    if (entry.omitWhenEmpty && isEmpty(value)) {
      continue;
    }

    result[entry.target] = value;
  }

  return result;
}

/** Check if a value is "empty" by ABAP initial value semantics */
export function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (typeof value === 'number' && value === 0) return true;
  if (value === '0') return true;
  if (value === '0000-00-00') return true;
  if (value === '00:00:00') return true;
  return false;
}
