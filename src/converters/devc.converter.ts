/**
 * DEVC converter — Packages (Development Classes).
 *
 * gCTS tables: TDEVC (package definition), TDEVCT (description), TADIR
 * abapGit output: .devc.xml
 */

import type { AbapgitObject, GctsObjectData, ValidationResult } from '../core/types.js';
import type { IObjectConverter } from './base-converter.js';
import { getFirstRow, getRows } from '../formats/gcts/reader.js';
import { buildAbapGitXml } from '../formats/abapgit/xml.js';
import { isEmpty } from './base-converter.js';

const TDEVC_KEEP_FIELDS = [
  'DEVCLASS', 'DLVUNIT', 'COMPONENT', 'NAMESPACE', 'TPCLASS',
  'PARENTCL', 'APPLICAT', 'PACKTYPE', 'RESTRICTED', 'MAINPACK',
  'KORRFLAG', 'SRV_CHECK', 'PERMINHER',
];

export class DevcConverter implements IObjectConverter {
  readonly objectType = 'DEVC';
  readonly description = 'Packages';
  readonly serializerClass = 'LCL_OBJECT_DEVC';

  toAbapGit(gctsObject: GctsObjectData): AbapgitObject {
    const tdevc = getFirstRow(gctsObject, 'TDEVC') ?? {};
    const tdevct = getRows(gctsObject, 'TDEVCT');

    const textRow = tdevct.find(r => r.SPRAS === 'E');
    const description = (textRow?.CTEXT ?? '') as string;

    const devcData: Record<string, unknown> = {};
    for (const field of TDEVC_KEEP_FIELDS) {
      const value = tdevc[field];
      if (!isEmpty(value)) devcData[field] = value;
    }
    if (description) devcData.CTEXT = description;

    const values: Record<string, unknown> = { DEVC: devcData };
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
    if (!getFirstRow(gctsObject, 'TDEVC')) {
      errors.push('Missing TDEVC table');
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  }
}
