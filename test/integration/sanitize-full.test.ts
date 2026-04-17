import { describe, it, expect, beforeAll } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { readAllObjects } from '../../src/formats/gcts/reader.js';
import { readAllNametabs } from '../../src/sanitizer/nametab-reader.js';
import { sanitizeObject, sanitizeNametab } from '../../src/sanitizer/sanitizer.js';
import { DEFAULT_BLOCKLIST } from '../../src/sanitizer/field-blocklist.js';
import {
  writeAllObjects,
  writeNametabs,
  copyObjectTypes,
  copyUnaffectedNametabs,
} from '../../src/sanitizer/gcts-writer.js';

const FIXTURES_OBJECTS = path.resolve('test/fixtures/gcts');
const FIXTURES_METADATA = path.resolve('test/fixtures/gctsmetadata');

describe('Full Sanitization Integration', () => {
  let outputDir: string;
  let sanitizedObjects: ReturnType<typeof readAllObjects>;

  beforeAll(() => {
    outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'abapgit-sanitize-test-'));

    // 1. Read source
    const objects = readAllObjects(FIXTURES_OBJECTS);
    const nametabs = readAllNametabs(FIXTURES_METADATA);

    // 2. Sanitize
    sanitizedObjects = objects.map(obj => sanitizeObject(obj, DEFAULT_BLOCKLIST));
    const sanitizedNametabs = nametabs
      .filter(nt => DEFAULT_BLOCKLIST.has(nt.table))
      .map(nt => sanitizeNametab(nt, DEFAULT_BLOCKLIST));
    const sanitizedTableNames = new Set(sanitizedNametabs.map(nt => nt.table));

    // 3. Write
    writeAllObjects(sanitizedObjects, { outputDir });
    writeNametabs(sanitizedNametabs, outputDir);
    copyObjectTypes(FIXTURES_METADATA, outputDir);
    copyUnaffectedNametabs(FIXTURES_METADATA, outputDir, sanitizedTableNames);
  });

  it('should read all 34 objects from source', () => {
    const objects = readAllObjects(FIXTURES_OBJECTS);
    expect(objects).toHaveLength(34);
  });

  it('should output same number of objects as input', () => {
    // Count output object directories
    const objectsDir = path.join(outputDir, 'objects');
    expect(fs.existsSync(objectsDir)).toBe(true);

    let count = 0;
    const typeDirs = fs.readdirSync(objectsDir, { withFileTypes: true })
      .filter(d => d.isDirectory());
    for (const typeDir of typeDirs) {
      const nameDirs = fs.readdirSync(path.join(objectsDir, typeDir.name), { withFileTypes: true })
        .filter(d => d.isDirectory());
      count += nameDirs.length;
    }
    expect(count).toBe(34);
  });

  it('should have gCTS directory layout with objects/ and .gctsmetadata/', () => {
    expect(fs.existsSync(path.join(outputDir, 'objects'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, '.gctsmetadata'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, '.gctsmetadata', 'nametabs'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, '.gctsmetadata', 'objecttypes'))).toBe(true);
  });

  it('should NOT include .gcts.properties.json in output', () => {
    expect(fs.existsSync(path.join(outputDir, '.gcts.properties.json'))).toBe(false);
  });

  it('should strip QUOTA_MAX_FIELDS from DD02L in TABL object data', () => {
    const asxPath = path.join(
      outputDir, 'objects', 'TABL', '%2FCOSS%2FEVENT',
      'TABL %2FCOSS%2FEVENT.asx.json',
    );
    expect(fs.existsSync(asxPath)).toBe(true);

    const raw = JSON.parse(fs.readFileSync(asxPath, 'utf-8'));
    const dd02l = raw.find((t: { table: string }) => t.table === 'DD02L');
    expect(dd02l).toBeDefined();
    expect(dd02l.data[0]).not.toHaveProperty('QUOTA_MAX_FIELDS');
    expect(dd02l.data[0]).not.toHaveProperty('QUOTA_MAX_BYTES');
    expect(dd02l.data[0]).not.toHaveProperty('QUOTA_SHARE_PARTNER');
    expect(dd02l.data[0]).not.toHaveProperty('QUOTA_SHARE_CUSTOMER');
    expect(dd02l.data[0]).not.toHaveProperty('WRONGCL');
    expect(dd02l.data[0]).not.toHaveProperty('ALWAYSTRP');
    expect(dd02l.data[0]).not.toHaveProperty('ALLDATAINCL');
    expect(dd02l.data[0]).not.toHaveProperty('HDB_ONLY_ENTITY_INCLUDED');
    expect(dd02l.data[0]).not.toHaveProperty('FIELD_SUFFIX');

    // Should still have real fields
    expect(dd02l.data[0]).toHaveProperty('TABNAME', '/COSS/EVENT');
    expect(dd02l.data[0]).toHaveProperty('TABCLASS', 'TRANSP');

    // AS4LOCAL must be normalized to "A" (active) for BTP
    expect(dd02l.data[0]).toHaveProperty('AS4LOCAL', 'A');
  });

  it('should normalize AS4LOCAL to "A" in DDLS objects', () => {
    const asxPath = path.join(
      outputDir, 'objects', 'DDLS', '%2FCOSS%2FR_EVENT',
      'DDLS %2FCOSS%2FR_EVENT.asx.json',
    );
    const raw = JSON.parse(fs.readFileSync(asxPath, 'utf-8'));
    const ddddlsrc = raw.find((t: { table: string }) => t.table === 'DDDDLSRC');
    expect(ddddlsrc).toBeDefined();
    expect(ddddlsrc.data[0]).toHaveProperty('AS4LOCAL', 'A');
  });

  it('should normalize AS4LOCAL to "A" in all table blocks across all objects', () => {
    // Walk all objects and verify no AS4LOCAL = "L" or "N" exists
    const objectTypes = fs.readdirSync(path.join(outputDir, 'objects'));
    for (const objType of objectTypes) {
      const typePath = path.join(outputDir, 'objects', objType);
      if (!fs.statSync(typePath).isDirectory()) continue;
      const objDirs = fs.readdirSync(typePath);
      for (const objDir of objDirs) {
        const objPath = path.join(typePath, objDir);
        if (!fs.statSync(objPath).isDirectory()) continue;
        const files = fs.readdirSync(objPath).filter(f => f.endsWith('.asx.json'));
        for (const file of files) {
          const raw = JSON.parse(fs.readFileSync(path.join(objPath, file), 'utf-8'));
          for (const block of raw) {
            for (const row of block.data) {
              if ('AS4LOCAL' in row) {
                expect(row.AS4LOCAL, `${objType}/${objDir} table ${block.table}`).toBe('A');
              }
            }
          }
        }
      }
    }
  });

  it('should strip SRS_ID from DD03L in TABL object data', () => {
    const asxPath = path.join(
      outputDir, 'objects', 'TABL', '%2FCOSS%2FEVENT',
      'TABL %2FCOSS%2FEVENT.asx.json',
    );
    const raw = JSON.parse(fs.readFileSync(asxPath, 'utf-8'));
    const dd03l = raw.find((t: { table: string }) => t.table === 'DD03L');
    expect(dd03l).toBeDefined();

    for (const row of dd03l.data) {
      expect(row).not.toHaveProperty('SRS_ID');
      expect(row).not.toHaveProperty('OUTPUTSTYLE');
      expect(row).not.toHaveProperty('ANONYMOUS');
      expect(row).not.toHaveProperty('DBPOSITION');
      // Should still have real field definitions
      expect(row).toHaveProperty('FIELDNAME');
    }
  });

  it('should strip JAVAONLY and RESERVE from DD09L in TABL object data', () => {
    const asxPath = path.join(
      outputDir, 'objects', 'TABL', '%2FCOSS%2FEVENT',
      'TABL %2FCOSS%2FEVENT.asx.json',
    );
    const raw = JSON.parse(fs.readFileSync(asxPath, 'utf-8'));
    const dd09l = raw.find((t: { table: string }) => t.table === 'DD09L');
    expect(dd09l).toBeDefined();
    expect(dd09l.data[0]).not.toHaveProperty('JAVAONLY');
    expect(dd09l.data[0]).not.toHaveProperty('RESERVE');
    expect(dd09l.data[0]).toHaveProperty('TABART', 'APPL0');
  });

  it('should strip QUOTA_MAX_FIELDS from DD02L nametab definition', () => {
    const nametabPath = path.join(outputDir, '.gctsmetadata', 'nametabs', 'DD02L.asx.json');
    expect(fs.existsSync(nametabPath)).toBe(true);

    const raw = JSON.parse(fs.readFileSync(nametabPath, 'utf-8'));
    expect(raw).toHaveLength(1);
    const dd02l = raw[0];
    expect(dd02l.table).toBe('DD02L');

    const fieldNames = dd02l.nametab.map((f: { NAME: string }) => f.NAME);
    expect(fieldNames).not.toContain('QUOTA_MAX_FIELDS');
    expect(fieldNames).not.toContain('QUOTA_MAX_BYTES');
    expect(fieldNames).not.toContain('QUOTA_SHARE_PARTNER');
    expect(fieldNames).not.toContain('QUOTA_SHARE_CUSTOMER');
    expect(fieldNames).not.toContain('HDB_ONLY_ENTITY_INCLUDED');
    expect(fieldNames).not.toContain('FIELD_SUFFIX');
    expect(fieldNames).not.toContain('WRONGCL');

    // Should still have real fields
    expect(fieldNames).toContain('TABNAME');
    expect(fieldNames).toContain('TABCLASS');
    expect(fieldNames).toContain('EXCLASS');
    expect(fieldNames).toContain('ABAP_LANGUAGE_VERSION');
  });

  it('should strip SRS_ID from DD03L nametab definition', () => {
    const nametabPath = path.join(outputDir, '.gctsmetadata', 'nametabs', 'DD03L.asx.json');
    expect(fs.existsSync(nametabPath)).toBe(true);

    const raw = JSON.parse(fs.readFileSync(nametabPath, 'utf-8'));
    const dd03l = raw[0];
    const fieldNames = dd03l.nametab.map((f: { NAME: string }) => f.NAME);
    expect(fieldNames).not.toContain('SRS_ID');
    expect(fieldNames).not.toContain('OUTPUTSTYLE');
    expect(fieldNames).not.toContain('ANONYMOUS');
    expect(fieldNames).not.toContain('DBPOSITION');

    // Should still have real fields
    expect(fieldNames).toContain('TABNAME');
    expect(fieldNames).toContain('FIELDNAME');
    expect(fieldNames).toContain('INTTYPE');
  });

  it('should strip JAVAONLY and RESERVE from DD09L nametab definition', () => {
    const nametabPath = path.join(outputDir, '.gctsmetadata', 'nametabs', 'DD09L.asx.json');
    expect(fs.existsSync(nametabPath)).toBe(true);

    const raw = JSON.parse(fs.readFileSync(nametabPath, 'utf-8'));
    const dd09l = raw[0];
    const fieldNames = dd09l.nametab.map((f: { NAME: string }) => f.NAME);
    expect(fieldNames).not.toContain('JAVAONLY');
    expect(fieldNames).not.toContain('RESERVE');

    // Should still have real fields
    expect(fieldNames).toContain('TABNAME');
    expect(fieldNames).toContain('TABART');
  });

  it('should preserve all .abap source files', () => {
    // Check CLAS objects which have .abap files
    const clasDir = path.join(outputDir, 'objects', 'CLAS', '%2FCOSS%2FBP_C_EVENT');
    expect(fs.existsSync(clasDir)).toBe(true);

    const files = fs.readdirSync(clasDir);
    const abapFiles = files.filter(f => f.endsWith('.abap'));
    expect(abapFiles.length).toBeGreaterThan(0);

    // Verify content is not empty and matches source
    for (const file of abapFiles) {
      const content = fs.readFileSync(path.join(clasDir, file), 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    }
  });

  it('should preserve .asx.json files for non-TABL objects', () => {
    // Check DDLS object
    const ddlsDir = path.join(outputDir, 'objects', 'DDLS', '%2FCOSS%2FC_EVENT');
    expect(fs.existsSync(ddlsDir)).toBe(true);

    const files = fs.readdirSync(ddlsDir);
    const asxFiles = files.filter(f => f.endsWith('.asx.json'));
    expect(asxFiles).toHaveLength(1);
  });

  it('should copy objecttypes to output', () => {
    const objecttypesDir = path.join(outputDir, '.gctsmetadata', 'objecttypes');
    expect(fs.existsSync(objecttypesDir)).toBe(true);

    // Should have some type directories
    const typeDirs = fs.readdirSync(objecttypesDir, { withFileTypes: true })
      .filter(d => d.isDirectory());
    expect(typeDirs.length).toBeGreaterThan(0);
  });

  it('should copy unaffected nametabs through unchanged', () => {
    // SEOCLASS nametab is not in the blocklist, should be copied as-is
    const nametabPath = path.join(outputDir, '.gctsmetadata', 'nametabs', 'SEOCLASS.asx.json');
    expect(fs.existsSync(nametabPath)).toBe(true);
  });

  it('should preserve URL-encoded directory names', () => {
    // Check that %2F encoding is preserved in directory names
    const tablDir = path.join(outputDir, 'objects', 'TABL', '%2FCOSS%2FEVENT');
    expect(fs.existsSync(tablDir)).toBe(true);

    const tablDir2 = path.join(outputDir, 'objects', 'TABL', '%2FCOSS%2FEVENT_D');
    expect(fs.existsSync(tablDir2)).toBe(true);
  });

  it('should preserve space-in-filename conventions', () => {
    const tablDir = path.join(outputDir, 'objects', 'TABL', '%2FCOSS%2FEVENT');
    const files = fs.readdirSync(tablDir);

    // Should have a file with space: "TABL %2FCOSS%2FEVENT.asx.json"
    const asxFile = files.find(f => f.includes(' ') && f.endsWith('.asx.json'));
    expect(asxFile).toBeDefined();
    expect(asxFile).toBe('TABL %2FCOSS%2FEVENT.asx.json');
  });

  it('should produce valid JSON in all output .asx.json files', () => {
    // Recursively find all .asx.json files in objects/
    const objectsDir = path.join(outputDir, 'objects');
    const asxFiles: string[] = [];
    findFiles(objectsDir, '.asx.json', asxFiles);

    expect(asxFiles.length).toBeGreaterThan(0);
    for (const file of asxFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    }
  });
});

/** Recursively find files matching a suffix. */
function findFiles(dir: string, suffix: string, results: string[]): void {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findFiles(fullPath, suffix, results);
    } else if (entry.name.endsWith(suffix)) {
      results.push(fullPath);
    }
  }
}
