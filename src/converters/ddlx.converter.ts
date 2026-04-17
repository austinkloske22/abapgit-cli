/**
 * DDLX converter — CDS Metadata Extensions (UI annotations).
 *
 * gCTS tables: DDLXSRC (source), DDLXSRCT (description), + runtime tables
 * abapGit output: .ddlx.xml (metadata) + .ddlx.asddlxs (source)
 */

import type { AbapgitObject, GctsObjectData, ValidationResult } from '../core/types.js';
import type { IObjectConverter } from './base-converter.js';
import { getFirstRow, getRows } from '../formats/gcts/reader.js';
import { buildAbapGitXml } from '../formats/abapgit/xml.js';
import { buildSourceFilename } from '../formats/abapgit/naming.js';

export class DdlxConverter implements IObjectConverter {
  readonly objectType = 'DDLX';
  readonly description = 'CDS Metadata Extensions';
  readonly serializerClass = 'LCL_OBJECT_DDLX';

  toAbapGit(gctsObject: GctsObjectData): AbapgitObject {
    const ddlxsrc = getFirstRow(gctsObject, 'DDLXSRC');
    const ddlxsrct = getRows(gctsObject, 'DDLXSRCT');

    const textRow = ddlxsrct.find(r => r.DDLANGUAGE === 'E');
    const description = (textRow?.DDTEXT ?? '') as string;
    const source = (ddlxsrc?.SOURCE ?? '') as string;

    const values: Record<string, unknown> = {
      DDLX: {
        DDLXNAME: gctsObject.objectName,
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
        { filename: buildSourceFilename('DDLX', gctsObject.objectName), content: cleanSource },
      ],
    };
  }

  validateGcts(gctsObject: GctsObjectData): ValidationResult {
    const errors: string[] = [];
    if (!getFirstRow(gctsObject, 'DDLXSRC')) {
      errors.push('Missing DDLXSRC table');
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  }
}
