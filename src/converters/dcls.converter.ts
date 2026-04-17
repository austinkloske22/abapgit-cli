/**
 * DCLS converter — Data Control Language Sources (access control).
 *
 * gCTS tables: ACMDCLSRC (source + metadata), ACMDCLSRCT (description), TADIR
 * abapGit output: .dcls.xml (metadata) + .dcls.asdcls (source)
 */

import type { AbapgitObject, GctsObjectData, ValidationResult } from '../core/types.js';
import type { IObjectConverter } from './base-converter.js';
import { getFirstRow, getRows } from '../formats/gcts/reader.js';
import { buildAbapGitXml } from '../formats/abapgit/xml.js';
import { buildSourceFilename } from '../formats/abapgit/naming.js';

export class DclsConverter implements IObjectConverter {
  readonly objectType = 'DCLS';
  readonly description = 'Data Control Language Sources (Access Control)';
  readonly serializerClass = 'LCL_OBJECT_DCLS';

  toAbapGit(gctsObject: GctsObjectData): AbapgitObject {
    const acmdclsrc = getFirstRow(gctsObject, 'ACMDCLSRC');
    const acmdclsrct = getRows(gctsObject, 'ACMDCLSRCT');

    const textRow = acmdclsrct.find(r => r.DDLANGUAGE === 'E');
    const description = (textRow?.DDTEXT ?? '') as string;

    const source = (acmdclsrc?.SOURCE ?? '') as string;

    const values: Record<string, unknown> = {
      DCLS: {
        DCLNAME: gctsObject.objectName,
        DDLANGUAGE: 'E',
        ...(description ? { DDTEXT: description } : {}),
      },
    };

    const xmlContent = buildAbapGitXml(this.serializerClass, values);
    const cleanSource = source.replace(/\r\n/g, '\n');

    return {
      objectType: this.objectType,
      objectName: gctsObject.objectName,
      xmlContent,
      additionalFiles: [
        { filename: buildSourceFilename('DCLS', gctsObject.objectName), content: cleanSource },
      ],
    };
  }

  validateGcts(gctsObject: GctsObjectData): ValidationResult {
    const errors: string[] = [];
    if (!getFirstRow(gctsObject, 'ACMDCLSRC')) {
      errors.push('Missing ACMDCLSRC table');
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  }
}
