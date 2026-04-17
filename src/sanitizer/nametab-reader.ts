/**
 * Reader for .gctsmetadata/nametabs/ files.
 *
 * Each file is a JSON array with one element:
 *   [{ table: "DD02L", nametab: [...], properties: [...] }]
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { ParseError } from '../core/errors.js';
import type { NametabDefinition } from './sanitizer.js';

/**
 * Read all nametab definitions from a metadata directory.
 * Reads from {metadataDir}/nametabs/*.asx.json
 */
export function readAllNametabs(metadataDir: string): NametabDefinition[] {
  const nametabsDir = path.join(metadataDir, 'nametabs');
  if (!fs.existsSync(nametabsDir)) {
    return [];
  }

  const nametabs: NametabDefinition[] = [];
  const files = fs.readdirSync(nametabsDir).filter(f => f.endsWith('.asx.json'));

  for (const file of files) {
    const filePath = path.join(nametabsDir, file);
    const nametab = readNametab(filePath);
    if (nametab) {
      nametabs.push(nametab);
    }
  }

  return nametabs;
}

/**
 * Read a single nametab .asx.json file.
 */
export function readNametab(filePath: string): NametabDefinition | undefined {
  const raw = fs.readFileSync(filePath, 'utf-8');
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return undefined;
    }

    const entry = parsed[0];
    if (!entry.table || !Array.isArray(entry.nametab)) {
      return undefined;
    }

    return {
      table: entry.table,
      nametab: entry.nametab,
      properties: entry.properties ?? [],
    };
  } catch (err) {
    throw new ParseError(filePath, (err as Error).message);
  }
}
