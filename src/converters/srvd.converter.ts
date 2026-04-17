/**
 * SRVD converter — Service Definitions.
 *
 * gCTS tables: SRVDSRC (source), SRVDSRCT (description), + runtime tables
 * abapGit output: .srvd.xml (metadata) + .srvd.assrvd (source)
 */

import type { AbapgitObject, GctsObjectData, ValidationResult } from '../core/types.js';
import type { IObjectConverter } from './base-converter.js';
import { getFirstRow, getRows } from '../formats/gcts/reader.js';
import { buildAbapGitXml } from '../formats/abapgit/xml.js';
import { buildSourceFilename } from '../formats/abapgit/naming.js';

export class SrvdConverter implements IObjectConverter {
  readonly objectType = 'SRVD';
  readonly description = 'Service Definitions';
  readonly serializerClass = 'LCL_OBJECT_SRVD';

  toAbapGit(gctsObject: GctsObjectData): AbapgitObject {
    const srvdsrc = getFirstRow(gctsObject, 'SRVDSRC');
    const srvdsrct = getRows(gctsObject, 'SRVDSRCT');

    const textRow = srvdsrct.find(r => r.DDLANGUAGE === 'E');
    const description = (textRow?.DDTEXT ?? '') as string;
    const source = (srvdsrc?.SOURCE ?? '') as string;

    const values: Record<string, unknown> = {
      SRVD: {
        SRVDNAME: gctsObject.objectName,
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
        { filename: buildSourceFilename('SRVD', gctsObject.objectName), content: cleanSource },
      ],
    };
  }

  validateGcts(gctsObject: GctsObjectData): ValidationResult {
    const errors: string[] = [];
    if (!getFirstRow(gctsObject, 'SRVDSRC')) {
      errors.push('Missing SRVDSRC table');
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  }
}
