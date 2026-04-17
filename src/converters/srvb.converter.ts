/**
 * SRVB converter — Service Bindings.
 *
 * gCTS tables: SRVB_HEAD (header), SRVB_HEAD_T (description),
 *              SRVB_BIND_TYPE, SRVB_SERVICES, TADIR
 * abapGit output: .srvb.xml (all metadata in XML, no source file)
 */

import type { AbapgitObject, GctsObjectData, ValidationResult } from '../core/types.js';
import type { IObjectConverter } from './base-converter.js';
import { getFirstRow, getRows } from '../formats/gcts/reader.js';
import { buildAbapGitXml } from '../formats/abapgit/xml.js';
import { isEmpty } from './base-converter.js';

export class SrvbConverter implements IObjectConverter {
  readonly objectType = 'SRVB';
  readonly description = 'Service Bindings';
  readonly serializerClass = 'LCL_OBJECT_SRVB';

  toAbapGit(gctsObject: GctsObjectData): AbapgitObject {
    const head = getFirstRow(gctsObject, 'SRVB_HEAD') ?? {};
    const headT = getRows(gctsObject, 'SRVB_HEAD_T');
    const bindType = getFirstRow(gctsObject, 'SRVB_BIND_TYPE') ?? {};
    const services = getRows(gctsObject, 'SRVB_SERVICES');

    const textRow = headT.find(r => r.LANGU === 'E' || r.LANGUAGE === 'E');
    const description = (textRow?.DESCRIPTION ?? textRow?.DDTEXT ?? '') as string;

    const srvbData: Record<string, unknown> = {
      SRVB_NAME: gctsObject.objectName,
      ...(description ? { DESCRIPTION: description } : {}),
    };

    // Add binding type
    const bt = bindType.BINDING_TYPE ?? head.BINDING_TYPE;
    if (!isEmpty(bt)) srvbData.BINDING_TYPE = bt;

    // Add services list
    if (services.length > 0) {
      srvbData.SRVB_SERVICES = services.map(svc => {
        const entry: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(svc)) {
          if (k !== 'SRVB_NAME' && !isEmpty(v)) entry[k] = v;
        }
        return entry;
      });
    }

    const values: Record<string, unknown> = { SRVB: srvbData };
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
    if (!getFirstRow(gctsObject, 'SRVB_HEAD')) {
      errors.push('Missing SRVB_HEAD table');
    }
    return { valid: errors.length === 0, errors, warnings: [] };
  }
}
