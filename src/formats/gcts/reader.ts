/**
 * gCTS repository reader.
 *
 * Traverses the gCTS directory layout and parses objects into in-memory model.
 *
 * Layout:
 *   objects/{OBJECT_TYPE}/{OBJECT_NAME_ENCODED}/{TYPE_PREFIX} {OBJECT_NAME_ENCODED}.asx.json
 *   objects/{OBJECT_TYPE}/{OBJECT_NAME_ENCODED}/{FILE_TYPE} {OBJECT_NAME_ENCODED}.abap
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { GctsObjectData, GctsSourceFile, GctsTableBlock } from '../../core/types.js';
import { ParseError } from '../../core/errors.js';
import { decodeGctsName, parseGctsFilename } from './naming.js';

/** Read all objects from a gCTS objects/ directory */
export function readAllObjects(objectsDir: string): GctsObjectData[] {
  if (!fs.existsSync(objectsDir)) {
    return [];
  }

  const objects: GctsObjectData[] = [];

  // Level 1: object type directories (TABL, DDLS, CLAS, etc.)
  const typeDirs = fs.readdirSync(objectsDir, { withFileTypes: true })
    .filter(d => d.isDirectory());

  for (const typeDir of typeDirs) {
    const objectType = typeDir.name;
    const typePath = path.join(objectsDir, objectType);

    // Level 2: object name directories (%2FCOSS%2FEVENT, etc.)
    const nameDirs = fs.readdirSync(typePath, { withFileTypes: true })
      .filter(d => d.isDirectory());

    for (const nameDir of nameDirs) {
      const objectName = decodeGctsName(nameDir.name);
      const objPath = path.join(typePath, nameDir.name);
      const obj = readObject(objPath, objectType, objectName);
      objects.push(obj);
    }
  }

  return objects;
}

/** Read a single object from its directory */
export function readObject(
  objDir: string,
  objectType: string,
  objectName: string,
): GctsObjectData {
  const files = fs.readdirSync(objDir);

  let tables: GctsTableBlock[] = [];
  const sourceFiles: GctsSourceFile[] = [];

  for (const file of files) {
    const filePath = path.join(objDir, file);

    if (file.endsWith('.asx.json')) {
      // Parse the main metadata JSON file
      tables = parseAsxJson(filePath);
    } else if (file.endsWith('.abap')) {
      // Read source file
      const parsed = parseGctsFilename(file);
      const content = fs.readFileSync(filePath, 'utf-8');
      sourceFiles.push({
        originalFilename: file,
        fileType: parsed.prefix,
        content,
      });
    }
  }

  return { objectType, objectName, tables, sourceFiles };
}

/** Parse a .asx.json file into table blocks */
export function parseAsxJson(filePath: string): GctsTableBlock[] {
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new ParseError(filePath, 'Expected top-level JSON array');
    }
    return parsed as GctsTableBlock[];
  } catch (err) {
    if (err instanceof ParseError) throw err;
    throw new ParseError(filePath, (err as Error).message);
  }
}

/** Get a specific table block from an object's data */
export function getTable(
  obj: GctsObjectData,
  tableName: string,
): GctsTableBlock | undefined {
  return obj.tables.find(t => t.table === tableName);
}

/** Get the first row of a table, or undefined */
export function getFirstRow(
  obj: GctsObjectData,
  tableName: string,
): Record<string, unknown> | undefined {
  const block = getTable(obj, tableName);
  return block?.data?.[0];
}

/** Get all rows of a table */
export function getRows(
  obj: GctsObjectData,
  tableName: string,
): Record<string, unknown>[] {
  const block = getTable(obj, tableName);
  return block?.data ?? [];
}
