/**
 * abapGit format writer.
 *
 * Writes AbapgitObject instances to disk in abapGit's directory layout.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { AbapgitObject } from '../../core/types.js';
import { buildXmlFilename } from './naming.js';

/** Write a single abapGit object to the output directory */
export function writeObject(outputDir: string, obj: AbapgitObject): void {
  fs.mkdirSync(outputDir, { recursive: true });

  // Write main XML file
  const xmlFilename = buildXmlFilename(obj.objectType, obj.objectName);
  fs.writeFileSync(path.join(outputDir, xmlFilename), obj.xmlContent, 'utf-8');

  // Write additional files (source code, CDS, etc.)
  for (const file of obj.additionalFiles) {
    fs.writeFileSync(path.join(outputDir, file.filename), file.content, 'utf-8');
  }
}

/** Write multiple abapGit objects to the output directory */
export function writeAll(outputDir: string, objects: AbapgitObject[]): void {
  for (const obj of objects) {
    writeObject(outputDir, obj);
  }
}
