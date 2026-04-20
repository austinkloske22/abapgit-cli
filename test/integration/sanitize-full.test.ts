import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { readAllObjects } from '../../src/formats/gcts/reader.js';
import { readAllNametabs } from '../../src/sanitizer/nametab-reader.js';
import { sanitizeObject } from '../../src/sanitizer/sanitizer.js';
import type { TadirNormalization } from '../../src/sanitizer/field-blocklist.js';
import {
  writeAllObjects,
  writeNametabs,
  copyObjectTypes,
  copyUnaffectedNametabs,
} from '../../src/sanitizer/gcts-writer.js';

const FIXTURES_OBJECTS = path.resolve('test/fixtures/gcts');
const FIXTURES_METADATA = path.resolve('test/fixtures/gctsmetadata');

const NORM: TadirNormalization = {
  cproject: ' S',
  crelease: '100',
  component: '/COSS/_UNIFIED',
};

describe('Full Sanitization Integration', () => {
  let outputDir: string;

  beforeAll(() => {
    outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'abapgit-sanitize-test-'));

    const objects = readAllObjects(FIXTURES_OBJECTS);
    const nametabs = readAllNametabs(FIXTURES_METADATA);

    // Normalize TADIR only — everything else passes through
    const normalizedObjects = objects.map(obj => sanitizeObject(obj, NORM));

    writeAllObjects(normalizedObjects, { outputDir });
    writeNametabs(nametabs, outputDir);
    copyObjectTypes(FIXTURES_METADATA, outputDir);
    copyUnaffectedNametabs(FIXTURES_METADATA, outputDir, new Set());
  });

  it('should have gCTS directory layout', () => {
    expect(fs.existsSync(path.join(outputDir, 'objects'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, '.gctsmetadata', 'nametabs'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, '.gctsmetadata', 'objecttypes'))).toBe(true);
  });

  it('should have all 22 object type directories', () => {
    const types = fs.readdirSync(path.join(outputDir, 'objects'));
    expect(types.length).toBeGreaterThanOrEqual(22);
  });

  it('should normalize CPROJECT to " S" in TADIR', () => {
    const asxPath = path.join(
      outputDir, 'objects', 'TABL', '%2FCOSS%2FEVENT',
      'TABL %2FCOSS%2FEVENT.asx.json',
    );
    const raw = JSON.parse(fs.readFileSync(asxPath, 'utf-8'));
    const tadir = raw.find((t: { table: string }) => t.table === 'TADIR');
    expect(tadir.data[0].CPROJECT).toBe(' S');
  });

  it('should normalize CRELEASE to "100" in TADIR', () => {
    const asxPath = path.join(
      outputDir, 'objects', 'TABL', '%2FCOSS%2FEVENT',
      'TABL %2FCOSS%2FEVENT.asx.json',
    );
    const raw = JSON.parse(fs.readFileSync(asxPath, 'utf-8'));
    const tadir = raw.find((t: { table: string }) => t.table === 'TADIR');
    expect(tadir.data[0].CRELEASE).toBe('100');
  });

  it('should set COMPONENT to /COSS/_UNIFIED in TADIR', () => {
    const asxPath = path.join(
      outputDir, 'objects', 'TABL', '%2FCOSS%2FEVENT',
      'TABL %2FCOSS%2FEVENT.asx.json',
    );
    const raw = JSON.parse(fs.readFileSync(asxPath, 'utf-8'));
    const tadir = raw.find((t: { table: string }) => t.table === 'TADIR');
    expect(tadir.data[0].COMPONENT).toBe('/COSS/_UNIFIED');
  });

  it('should preserve ALL 55 DD02L fields (no stripping)', () => {
    const asxPath = path.join(
      outputDir, 'objects', 'TABL', '%2FCOSS%2FEVENT',
      'TABL %2FCOSS%2FEVENT.asx.json',
    );
    const raw = JSON.parse(fs.readFileSync(asxPath, 'utf-8'));
    const dd02l = raw.find((t: { table: string }) => t.table === 'DD02L');
    expect(Object.keys(dd02l.data[0]).length).toBe(55);
    expect(dd02l.data[0]).toHaveProperty('QUOTA_MAX_FIELDS');
    expect(dd02l.data[0]).toHaveProperty('HDB_ONLY_ENTITY_INCLUDED');
    expect(dd02l.data[0]).toHaveProperty('WRONGCL');
    expect(dd02l.data[0]).toHaveProperty('AS4LOCAL', 'L');
  });

  it('should preserve ALL 31 DD03L fields (no stripping)', () => {
    const asxPath = path.join(
      outputDir, 'objects', 'TABL', '%2FCOSS%2FEVENT',
      'TABL %2FCOSS%2FEVENT.asx.json',
    );
    const raw = JSON.parse(fs.readFileSync(asxPath, 'utf-8'));
    const dd03l = raw.find((t: { table: string }) => t.table === 'DD03L');
    expect(Object.keys(dd03l.data[0]).length).toBe(31);
    expect(dd03l.data[0]).toHaveProperty('SRS_ID');
    expect(dd03l.data[0]).toHaveProperty('DBPOSITION');
  });

  it('should preserve 55-field DD02L nametab unchanged', () => {
    const ntPath = path.join(outputDir, '.gctsmetadata', 'nametabs', 'DD02L.asx.json');
    const raw = JSON.parse(fs.readFileSync(ntPath, 'utf-8'));
    expect(raw[0].nametab.length).toBe(55);
  });

  it('should preserve all .abap source files', () => {
    const abapFiles: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.name.endsWith('.abap')) abapFiles.push(full);
      }
    };
    walk(path.join(outputDir, 'objects'));
    expect(abapFiles.length).toBeGreaterThan(0);
    for (const f of abapFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    }
  });

  it('should NOT write .gcts.properties.json', () => {
    expect(fs.existsSync(path.join(outputDir, '.gcts.properties.json'))).toBe(false);
  });

  it('should normalize TADIR in ALL objects', () => {
    const objectTypes = fs.readdirSync(path.join(outputDir, 'objects'));
    for (const objType of objectTypes) {
      const typePath = path.join(outputDir, 'objects', objType);
      if (!fs.statSync(typePath).isDirectory()) continue;
      for (const objDir of fs.readdirSync(typePath)) {
        const objPath = path.join(typePath, objDir);
        if (!fs.statSync(objPath).isDirectory()) continue;
        const files = fs.readdirSync(objPath).filter(f => f.endsWith('.asx.json'));
        for (const file of files) {
          const raw = JSON.parse(fs.readFileSync(path.join(objPath, file), 'utf-8'));
          const tadir = raw.find((t: { table: string }) => t.table === 'TADIR');
          if (tadir) {
            expect(tadir.data[0].CPROJECT, `${objType}/${objDir}`).toBe(' S');
            expect(tadir.data[0].CRELEASE, `${objType}/${objDir}`).toBe('100');
            expect(tadir.data[0].COMPONENT, `${objType}/${objDir}`).toBe('/COSS/_UNIFIED');
          }
        }
      }
    }
  });
});
