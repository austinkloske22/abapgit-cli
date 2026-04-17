/**
 * BDEF converter — Behavior Definitions.
 *
 * Converts between gCTS format (BDEF_WBDATA metadata + REPS BD source)
 * and abapGit format (minimal XML + .asbdef source file).
 *
 * This is one of the simpler converters since the behavior definition
 * is primarily source-based.
 */

import type { AbapgitObject, GctsObjectData, ValidationResult } from '../core/types.js';
import type { IObjectConverter } from './base-converter.js';
import { getRows } from '../formats/gcts/reader.js';
import { buildAbapGitXml } from '../formats/abapgit/xml.js';
import { buildSourceFilename } from '../formats/abapgit/naming.js';

export class BdefConverter implements IObjectConverter {
  readonly objectType = 'BDEF';
  readonly description = 'Behavior Definitions';
  readonly serializerClass = 'LCL_OBJECT_BDEF';

  toAbapGit(gctsObject: GctsObjectData): AbapgitObject {
    // Get description from TRDIRT
    const trdirtRows = getRows(gctsObject, 'TRDIRT');
    const textRow = trdirtRows.find(r => r.SPRSL === 'E' || r.LANGUAGE === 'E');
    const description = (textRow?.TEXT ?? textRow?.DDTEXT ?? '') as string;

    // Build minimal XML
    const values: Record<string, unknown> = {
      BDEF: {
        BDEF_NAME: gctsObject.objectName,
        ...(description ? { DESCRIPTION: description } : {}),
      },
    };

    const xmlContent = buildAbapGitXml(this.serializerClass, values);

    // Find the behavior definition source file (REPS ...BD.abap)
    const bdSource = gctsObject.sourceFiles.find(
      f => f.fileType === 'REPS' && f.originalFilename.includes('BD.abap'),
    );

    const additionalFiles = [];
    if (bdSource) {
      const sourceFilename = buildSourceFilename('BDEF', gctsObject.objectName);
      additionalFiles.push({
        filename: sourceFilename,
        content: bdSource.content.replace(/\r\n/g, '\n'),
      });
    }

    return {
      objectType: this.objectType,
      objectName: gctsObject.objectName,
      xmlContent,
      additionalFiles,
    };
  }

  validateGcts(gctsObject: GctsObjectData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const bdSource = gctsObject.sourceFiles.find(
      f => f.fileType === 'REPS' && f.originalFilename.includes('BD.abap'),
    );
    if (!bdSource) {
      errors.push('Missing behavior definition source file (REPS ...BD.abap)');
    }

    return { valid: errors.length === 0, errors, warnings };
  }
}
