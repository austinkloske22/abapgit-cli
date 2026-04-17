/**
 * CLAS converter — ABAP Classes.
 *
 * The most complex converter because gCTS splits class source across many files:
 *   CPUB (public section), CPRI (private section), CPRO (protected section),
 *   CLSD (class pool), CINC ==CCIMP (locals impl), CINC ==CCDEF (locals def),
 *   CINC ==CCMAC (macros), CINC ==CCAU (test classes), REPS ==CT (test include),
 *   METH (individual method source)
 *
 * abapGit expects:
 *   .clas.xml (metadata), .clas.abap (global class),
 *   .clas.locals_imp.abap, .clas.locals_def.abap,
 *   .clas.macros.abap, .clas.testclasses.abap
 */

import type { AbapgitObject, GctsObjectData, ValidationResult } from '../core/types.js';
import type { IObjectConverter } from './base-converter.js';
import { getFirstRow, getRows } from '../formats/gcts/reader.js';
import { buildAbapGitXml } from '../formats/abapgit/xml.js';
import { toAbapgitFilename, CLASS_FILE_MAP } from '../formats/abapgit/naming.js';
import { isEmpty } from './base-converter.js';

export class ClasConverter implements IObjectConverter {
  readonly objectType = 'CLAS';
  readonly description = 'ABAP Classes';
  readonly serializerClass = 'LCL_OBJECT_CLAS';

  toAbapGit(gctsObject: GctsObjectData): AbapgitObject {
    const vseoclass = this.buildVSEOCLASS(gctsObject);

    const values: Record<string, unknown> = { VSEOCLASS: vseoclass };
    const xmlContent = buildAbapGitXml(this.serializerClass, values);

    const additionalFiles = this.buildSourceFiles(gctsObject);

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

    if (!getFirstRow(gctsObject, 'SEOCLASS') && !getFirstRow(gctsObject, 'SEOCLASSDF')) {
      errors.push('Missing SEOCLASS/SEOCLASSDF table (class definition)');
    }

    const hasSource = gctsObject.sourceFiles.some(
      f => f.fileType === 'CPUB' || f.fileType === 'CLSD',
    );
    if (!hasSource) {
      warnings.push('No class source files found (CPUB or CLSD)');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  private buildVSEOCLASS(obj: GctsObjectData): Record<string, unknown> {
    const seoclassdf = getFirstRow(obj, 'SEOCLASSDF') ?? {};
    const seoclasstx = getRows(obj, 'SEOCLASSTX');
    const seoclass = getFirstRow(obj, 'SEOCLASS') ?? {};

    // Get description
    const textRow = seoclasstx.find(r => r.LANGU === 'E');
    const description = (textRow?.DESCRIPT ?? '') as string;

    // Get REFCLSNAME from SEOMETAREL (interface implementations)
    const metaRels = getRows(obj, 'SEOMETAREL');
    const refclsname = (seoclassdf.REFCLSNAME ?? seoclass.REFCLSNAME ?? '') as string;

    // Build VSEOCLASS (portable subset of SEOCLASSDF)
    const result: Record<string, unknown> = {
      CLSNAME: obj.objectName,
      LANGU: 'E',
    };

    if (description) result.DESCRIPT = description;

    const fieldsToKeep = [
      'CATEGORY', 'EXPOSURE', 'STATE', 'CLSABSTRCT', 'CLSFINAL',
      'CLSCCINCL', 'FIXPT', 'UNICODE', 'WITH_UNIT_TESTS',
      'DURATION_TYPE', 'RISK_LEVEL',
    ];

    for (const field of fieldsToKeep) {
      const value = seoclassdf[field];
      if (!isEmpty(value)) {
        result[field] = value;
      }
    }

    if (refclsname) result.REFCLSNAME = refclsname;

    return result;
  }

  private buildSourceFiles(obj: GctsObjectData): Array<{ filename: string; content: string }> {
    const base = toAbapgitFilename(obj.objectName);
    const files: Array<{ filename: string; content: string }> = [];

    // Main class source (.clas.abap) — from CLSD or reconstructed from CPUB
    const clsd = obj.sourceFiles.find(f => f.fileType === 'CLSD');
    const cpub = obj.sourceFiles.find(f => f.fileType === 'CPUB');
    const mainSource = clsd?.content ?? cpub?.content ?? '';
    if (mainSource.trim()) {
      files.push({
        filename: `${base}.clas.abap`,
        content: mainSource.replace(/\r\n/g, '\n'),
      });
    }

    // Local includes from CINC files
    for (const sourceFile of obj.sourceFiles) {
      if (sourceFile.fileType !== 'CINC') continue;

      // Determine which local file this maps to based on suffix
      const suffixMatch = sourceFile.originalFilename.match(/==+(\w+)\.abap$/);
      if (!suffixMatch) continue;

      const suffix = suffixMatch[1];
      const abapgitExt = CLASS_FILE_MAP[suffix];
      if (!abapgitExt) continue;

      const content = sourceFile.content.replace(/\r\n/g, '\n');
      if (content.trim()) {
        files.push({ filename: `${base}${abapgitExt}`, content });
      }
    }

    // Test include from REPS ==CT
    const testInclude = obj.sourceFiles.find(
      f => f.fileType === 'REPS' && f.originalFilename.includes('CT.abap'),
    );
    if (testInclude?.content.trim()) {
      files.push({
        filename: `${base}.clas.testclasses.abap`,
        content: testInclude.content.replace(/\r\n/g, '\n'),
      });
    }

    return files;
  }
}
