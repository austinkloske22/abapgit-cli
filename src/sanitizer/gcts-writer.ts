/**
 * gCTS format writer.
 *
 * Writes sanitized gCTS objects back to disk in the same directory layout:
 *   objects/{TYPE}/{NAME_ENCODED}/{PREFIX} {NAME_ENCODED}.asx.json
 *   objects/{TYPE}/{NAME_ENCODED}/{FILE_TYPE} {NAME_ENCODED}.abap
 *   .gctsmetadata/nametabs/{TABLE}.asx.json
 *   .gctsmetadata/objecttypes/{TYPE}/{TYPE}.asx.json
 *
 * NEVER writes .gcts.properties.json — that is the target repo's identity.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { GctsObjectData } from '../core/types.js';
import type { NametabDefinition } from './sanitizer.js';
import { encodeGctsName } from '../formats/gcts/naming.js';

/** Options for writing gCTS output. */
export interface GctsWriterOptions {
  outputDir: string;
}

/**
 * Write all sanitized objects to the output directory in gCTS layout.
 */
export function writeAllObjects(
  objects: GctsObjectData[],
  options: GctsWriterOptions,
): void {
  const objectsDir = path.join(options.outputDir, 'objects');
  fs.mkdirSync(objectsDir, { recursive: true });

  for (const obj of objects) {
    writeObject(obj, objectsDir);
  }
}

/**
 * Write a single object to the objects/ directory.
 */
export function writeObject(
  obj: GctsObjectData,
  objectsDir: string,
): void {
  const encodedName = encodeGctsName(obj.objectName);
  const objDir = path.join(objectsDir, obj.objectType, encodedName);
  fs.mkdirSync(objDir, { recursive: true });

  // Write .asx.json file
  const asxFilename = `${obj.objectType} ${encodedName}.asx.json`;
  const asxPath = path.join(objDir, asxFilename);
  const asxContent = JSON.stringify(obj.tables, null, 1);
  fs.writeFileSync(asxPath, asxContent, 'utf-8');

  // Write source files (.abap, etc.) — pass through unchanged
  for (const source of obj.sourceFiles) {
    const srcPath = path.join(objDir, source.originalFilename);
    fs.writeFileSync(srcPath, source.content, 'utf-8');
  }
}

/**
 * Write all nametab definitions to .gctsmetadata/nametabs/.
 */
export function writeNametabs(
  nametabs: NametabDefinition[],
  outputDir: string,
): void {
  const nametabsDir = path.join(outputDir, '.gctsmetadata', 'nametabs');
  fs.mkdirSync(nametabsDir, { recursive: true });

  for (const nametab of nametabs) {
    writeNametab(nametab, nametabsDir);
  }
}

/**
 * Write a single nametab definition.
 */
export function writeNametab(
  nametab: NametabDefinition,
  nametabsDir: string,
): void {
  // Reconstruct the array-wrapped format that gCTS expects
  const content = [
    {
      table: nametab.table,
      nametab: nametab.nametab,
      properties: nametab.properties,
    },
  ];

  // URL-encode table names that contain / (e.g., /IWBEP/I_V4_MSGA → %2FIWBEP%2FI_V4_MSGA)
  const encodedTable = nametab.table.replace(/\//g, '%2F');
  const filename = `${encodedTable}.asx.json`;
  const filePath = path.join(nametabsDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(content, null, 1), 'utf-8');
}

/**
 * Copy objecttypes directory from source metadata to output.
 */
export function copyObjectTypes(
  sourceMetadataDir: string,
  outputDir: string,
): void {
  const sourceDir = path.join(sourceMetadataDir, 'objecttypes');
  const targetDir = path.join(outputDir, '.gctsmetadata', 'objecttypes');

  if (!fs.existsSync(sourceDir)) {
    return;
  }

  copyDirRecursive(sourceDir, targetDir);
}

/**
 * Copy all nametab files that are NOT in the blocklist-affected set
 * (i.e., pass through nametabs for tables we don't need to sanitize).
 */
export function copyUnaffectedNametabs(
  sourceMetadataDir: string,
  outputDir: string,
  sanitizedTableNames: Set<string>,
): void {
  const sourceDir = path.join(sourceMetadataDir, 'nametabs');
  const targetDir = path.join(outputDir, '.gctsmetadata', 'nametabs');

  if (!fs.existsSync(sourceDir)) {
    return;
  }

  fs.mkdirSync(targetDir, { recursive: true });

  const files = fs.readdirSync(sourceDir);
  for (const file of files) {
    if (!file.endsWith('.asx.json')) continue;

    // Extract table name from filename (e.g., "DD02L.asx.json" → "DD02L")
    const tableName = file.replace('.asx.json', '');

    // Skip files we've already written sanitized versions of
    if (sanitizedTableNames.has(tableName)) continue;

    const srcPath = path.join(sourceDir, file);
    const dstPath = path.join(targetDir, file);
    fs.copyFileSync(srcPath, dstPath);
  }
}

/** Recursively copy a directory. */
function copyDirRecursive(src: string, dst: string): void {
  fs.mkdirSync(dst, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const dstPath = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
    }
  }
}
