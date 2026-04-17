import { describe, it, expect } from 'vitest';
import {
  sanitizeObjectData,
  sanitizeNametab,
  sanitizeObject,
  sanitizeTableBlock,
  validateConsistency,
} from '../../../src/sanitizer/sanitizer.js';
import type { NametabDefinition } from '../../../src/sanitizer/sanitizer.js';
import { DEFAULT_BLOCKLIST } from '../../../src/sanitizer/field-blocklist.js';
import type { GctsTableBlock, GctsObjectData } from '../../../src/core/types.js';
import { readObject } from '../../../src/formats/gcts/reader.js';
import * as path from 'node:path';

const FIXTURES = path.resolve('test/fixtures/gcts');

describe('sanitizer', () => {
  describe('sanitizeTableBlock', () => {
    it('should strip QUOTA_MAX_FIELDS from DD02L data', () => {
      const block: GctsTableBlock = {
        table: 'DD02L',
        data: [
          {
            TABNAME: '/TEST/TABLE',
            TABCLASS: 'TRANSP',
            QUOTA_MAX_FIELDS: 0,
            QUOTA_MAX_BYTES: 0,
            EXCLASS: 1,
          },
        ],
      };

      const result = sanitizeTableBlock(block, DEFAULT_BLOCKLIST);

      expect(result.data[0]).toHaveProperty('TABNAME', '/TEST/TABLE');
      expect(result.data[0]).toHaveProperty('TABCLASS', 'TRANSP');
      expect(result.data[0]).toHaveProperty('EXCLASS', 1);
      expect(result.data[0]).not.toHaveProperty('QUOTA_MAX_FIELDS');
      expect(result.data[0]).not.toHaveProperty('QUOTA_MAX_BYTES');
    });

    it('should strip SRS_ID from DD03L data', () => {
      const block: GctsTableBlock = {
        table: 'DD03L',
        data: [
          {
            TABNAME: '/TEST/TABLE',
            FIELDNAME: 'MY_FIELD',
            INTTYPE: 'C',
            INTLEN: 10,
            SRS_ID: 0,
            OUTPUTSTYLE: 0,
            ANONYMOUS: '',
            DBPOSITION: 0,
          },
        ],
      };

      const result = sanitizeTableBlock(block, DEFAULT_BLOCKLIST);

      expect(result.data[0]).toHaveProperty('TABNAME', '/TEST/TABLE');
      expect(result.data[0]).toHaveProperty('FIELDNAME', 'MY_FIELD');
      expect(result.data[0]).toHaveProperty('INTTYPE', 'C');
      expect(result.data[0]).toHaveProperty('INTLEN', 10);
      expect(result.data[0]).not.toHaveProperty('SRS_ID');
      expect(result.data[0]).not.toHaveProperty('OUTPUTSTYLE');
      expect(result.data[0]).not.toHaveProperty('ANONYMOUS');
      expect(result.data[0]).not.toHaveProperty('DBPOSITION');
    });

    it('should strip JAVAONLY and RESERVE from DD09L data', () => {
      const block: GctsTableBlock = {
        table: 'DD09L',
        data: [
          {
            TABNAME: '/TEST/TABLE',
            TABART: 'APPL0',
            JAVAONLY: '',
            RESERVE: '',
          },
        ],
      };

      const result = sanitizeTableBlock(block, DEFAULT_BLOCKLIST);

      expect(result.data[0]).toHaveProperty('TABNAME', '/TEST/TABLE');
      expect(result.data[0]).toHaveProperty('TABART', 'APPL0');
      expect(result.data[0]).not.toHaveProperty('JAVAONLY');
      expect(result.data[0]).not.toHaveProperty('RESERVE');
    });

    it('should normalize AS4LOCAL from "L" to "A" in DD02L', () => {
      const block: GctsTableBlock = {
        table: 'DD02L',
        data: [{ TABNAME: '/TEST/TABLE', AS4LOCAL: 'L', TABCLASS: 'TRANSP' }],
      };
      const result = sanitizeTableBlock(block, DEFAULT_BLOCKLIST);
      expect(result.data[0]).toHaveProperty('AS4LOCAL', 'A');
    });

    it('should normalize AS4LOCAL from "N" to "A" in any table', () => {
      const block: GctsTableBlock = {
        table: 'DDDDLSRC',
        data: [{ DDLNAME: '/TEST/VIEW', AS4LOCAL: 'N', SOURCE: 'define view...' }],
      };
      // DDDDLSRC is not in the blocklist, but AS4LOCAL normalization applies to all tables
      const result = sanitizeTableBlock(block, DEFAULT_BLOCKLIST);
      expect(result.data[0]).toHaveProperty('AS4LOCAL', 'A');
    });

    it('should leave AS4LOCAL as "A" if already active', () => {
      const block: GctsTableBlock = {
        table: 'DD02L',
        data: [{ TABNAME: '/TEST/TABLE', AS4LOCAL: 'A', TABCLASS: 'TRANSP' }],
      };
      const result = sanitizeTableBlock(block, DEFAULT_BLOCKLIST);
      expect(result.data[0]).toHaveProperty('AS4LOCAL', 'A');
    });

    it('should pass through tables not in blocklist unchanged', () => {
      const block: GctsTableBlock = {
        table: 'DD02T',
        data: [
          {
            TABNAME: '/TEST/TABLE',
            DDLANGUAGE: 'E',
            DDTEXT: 'Test Table',
          },
        ],
      };

      const result = sanitizeTableBlock(block, DEFAULT_BLOCKLIST);

      // Data should be equivalent (no fields removed or changed)
      expect(result.data).toStrictEqual(block.data);
    });

    it('should not mutate the original block', () => {
      const block: GctsTableBlock = {
        table: 'DD02L',
        data: [{ TABNAME: '/T/T', QUOTA_MAX_FIELDS: 0, EXCLASS: 1 }],
      };

      sanitizeTableBlock(block, DEFAULT_BLOCKLIST);

      // Original should still have the blocked field
      expect(block.data[0]).toHaveProperty('QUOTA_MAX_FIELDS');
    });
  });

  describe('sanitizeObjectData', () => {
    it('should sanitize all table blocks in an object', () => {
      const tables: GctsTableBlock[] = [
        {
          table: 'DD02L',
          data: [{ TABNAME: '/T/T', QUOTA_MAX_FIELDS: 0, EXCLASS: 1 }],
        },
        {
          table: 'DD03L',
          data: [{ FIELDNAME: 'F1', SRS_ID: 0, INTTYPE: 'C' }],
        },
        {
          table: 'DD02T',
          data: [{ DDTEXT: 'Test' }],
        },
      ];

      const result = sanitizeObjectData(tables, DEFAULT_BLOCKLIST);

      expect(result).toHaveLength(3);
      expect(result[0].data[0]).not.toHaveProperty('QUOTA_MAX_FIELDS');
      expect(result[0].data[0]).toHaveProperty('EXCLASS', 1);
      expect(result[1].data[0]).not.toHaveProperty('SRS_ID');
      expect(result[1].data[0]).toHaveProperty('INTTYPE', 'C');
      expect(result[2].data[0]).toHaveProperty('DDTEXT', 'Test');
    });
  });

  describe('sanitizeNametab', () => {
    it('should strip QUOTA_MAX_FIELDS from DD02L nametab', () => {
      const nametab: NametabDefinition = {
        table: 'DD02L',
        nametab: [
          { NAME: 'TABNAME', KEY: 'X', TYPE: 'C', LENGTH: 30, DECIMALS: -1 },
          { NAME: 'EXCLASS', KEY: '', TYPE: 'N', LENGTH: 1, DECIMALS: -1 },
          { NAME: 'QUOTA_MAX_FIELDS', KEY: '', TYPE: 'N', LENGTH: 5, DECIMALS: -1 },
          { NAME: 'QUOTA_MAX_BYTES', KEY: '', TYPE: 'N', LENGTH: 7, DECIMALS: -1 },
          { NAME: 'WRONGCL', KEY: '', TYPE: 'C', LENGTH: 1, DECIMALS: -1 },
        ],
        properties: [
          { CLIENTDEPENDENCY: 'NO', DELIVERYCLASS: 'W', TABART: 'SSEXC', TABFORM: 'T', REFNAME: '-' },
        ],
      };

      const result = sanitizeNametab(nametab, DEFAULT_BLOCKLIST);

      const fieldNames = result.nametab.map(f => f.NAME);
      expect(fieldNames).toContain('TABNAME');
      expect(fieldNames).toContain('EXCLASS');
      expect(fieldNames).not.toContain('QUOTA_MAX_FIELDS');
      expect(fieldNames).not.toContain('QUOTA_MAX_BYTES');
      expect(fieldNames).not.toContain('WRONGCL');
    });

    it('should strip SRS_ID, OUTPUTSTYLE, ANONYMOUS, DBPOSITION from DD03L nametab', () => {
      const nametab: NametabDefinition = {
        table: 'DD03L',
        nametab: [
          { NAME: 'TABNAME', KEY: 'X', TYPE: 'C', LENGTH: 30, DECIMALS: -1 },
          { NAME: 'FIELDNAME', KEY: 'X', TYPE: 'C', LENGTH: 30, DECIMALS: -1 },
          { NAME: 'INTTYPE', KEY: '', TYPE: 'C', LENGTH: 1, DECIMALS: -1 },
          { NAME: 'DBPOSITION', KEY: '', TYPE: 'N', LENGTH: 4, DECIMALS: -1 },
          { NAME: 'ANONYMOUS', KEY: '', TYPE: 'C', LENGTH: 1, DECIMALS: -1 },
          { NAME: 'OUTPUTSTYLE', KEY: '', TYPE: 'N', LENGTH: 2, DECIMALS: -1 },
          { NAME: 'SRS_ID', KEY: '', TYPE: 'I', LENGTH: 4, DECIMALS: -1 },
        ],
        properties: [
          { CLIENTDEPENDENCY: 'NO', DELIVERYCLASS: 'W', TABART: 'SSEXC', TABFORM: 'T', REFNAME: '-' },
        ],
      };

      const result = sanitizeNametab(nametab, DEFAULT_BLOCKLIST);

      const fieldNames = result.nametab.map(f => f.NAME);
      expect(fieldNames).toContain('TABNAME');
      expect(fieldNames).toContain('FIELDNAME');
      expect(fieldNames).toContain('INTTYPE');
      expect(fieldNames).not.toContain('DBPOSITION');
      expect(fieldNames).not.toContain('ANONYMOUS');
      expect(fieldNames).not.toContain('OUTPUTSTYLE');
      expect(fieldNames).not.toContain('SRS_ID');
    });

    it('should pass through nametabs for non-blocklisted tables', () => {
      const nametab: NametabDefinition = {
        table: 'SEOCLASS',
        nametab: [
          { NAME: 'CLSNAME', KEY: 'X', TYPE: 'C', LENGTH: 30, DECIMALS: -1 },
        ],
        properties: [],
      };

      const result = sanitizeNametab(nametab, DEFAULT_BLOCKLIST);
      expect(result).toBe(nametab);
    });

    it('should not mutate the original nametab', () => {
      const nametab: NametabDefinition = {
        table: 'DD02L',
        nametab: [
          { NAME: 'TABNAME', KEY: 'X', TYPE: 'C', LENGTH: 30, DECIMALS: -1 },
          { NAME: 'QUOTA_MAX_FIELDS', KEY: '', TYPE: 'N', LENGTH: 5, DECIMALS: -1 },
        ],
        properties: [],
      };

      sanitizeNametab(nametab, DEFAULT_BLOCKLIST);

      // Original should still have the blocked field
      expect(nametab.nametab).toHaveLength(2);
    });

    it('should preserve properties in sanitized nametab', () => {
      const nametab: NametabDefinition = {
        table: 'DD02L',
        nametab: [
          { NAME: 'QUOTA_MAX_FIELDS', KEY: '', TYPE: 'N', LENGTH: 5, DECIMALS: -1 },
        ],
        properties: [
          { CLIENTDEPENDENCY: 'NO', DELIVERYCLASS: 'W', TABART: 'SSEXC', TABFORM: 'T', REFNAME: '-' },
        ],
      };

      const result = sanitizeNametab(nametab, DEFAULT_BLOCKLIST);
      expect(result.properties).toHaveLength(1);
      expect(result.properties[0].DELIVERYCLASS).toBe('W');
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize a real TABL object from fixtures', () => {
      const gctsObj = readObject(
        path.join(FIXTURES, 'TABL', '%2FCOSS%2FEVENT'),
        'TABL',
        '/COSS/EVENT',
      );

      const result = sanitizeObject(gctsObj, DEFAULT_BLOCKLIST);

      // DD02L should have blocklisted fields stripped
      const dd02l = result.tables.find(t => t.table === 'DD02L');
      expect(dd02l).toBeDefined();
      expect(dd02l!.data[0]).not.toHaveProperty('QUOTA_MAX_FIELDS');
      expect(dd02l!.data[0]).not.toHaveProperty('QUOTA_MAX_BYTES');
      expect(dd02l!.data[0]).not.toHaveProperty('WRONGCL');
      expect(dd02l!.data[0]).toHaveProperty('TABNAME', '/COSS/EVENT');
      expect(dd02l!.data[0]).toHaveProperty('TABCLASS', 'TRANSP');

      // DD03L should have SRS_ID stripped
      const dd03l = result.tables.find(t => t.table === 'DD03L');
      expect(dd03l).toBeDefined();
      for (const row of dd03l!.data) {
        expect(row).not.toHaveProperty('SRS_ID');
        expect(row).not.toHaveProperty('OUTPUTSTYLE');
        expect(row).not.toHaveProperty('ANONYMOUS');
        expect(row).not.toHaveProperty('DBPOSITION');
        // Should still have real field data
        expect(row).toHaveProperty('FIELDNAME');
        expect(row).toHaveProperty('INTTYPE');
      }

      // DD09L should have JAVAONLY and RESERVE stripped
      const dd09l = result.tables.find(t => t.table === 'DD09L');
      expect(dd09l).toBeDefined();
      expect(dd09l!.data[0]).not.toHaveProperty('JAVAONLY');
      expect(dd09l!.data[0]).not.toHaveProperty('RESERVE');
      expect(dd09l!.data[0]).toHaveProperty('TABART', 'APPL0');

      // DD02T and TADIR should be untouched
      const dd02t = result.tables.find(t => t.table === 'DD02T');
      expect(dd02t).toBeDefined();
      expect(dd02t!.data[0]).toHaveProperty('DDTEXT', 'Event Table');

      // Source files should be preserved (this TABL has none, but structure should hold)
      expect(result.sourceFiles).toEqual(gctsObj.sourceFiles);
    });

    it('should pass .abap source files through unchanged', () => {
      const obj: GctsObjectData = {
        objectType: 'CLAS',
        objectName: '/TEST/CLASS',
        tables: [],
        sourceFiles: [
          { originalFilename: 'CPUB /TEST/CLASS.abap', fileType: 'CPUB', content: 'CLASS /test/class DEFINITION PUBLIC.' },
        ],
      };

      const result = sanitizeObject(obj, DEFAULT_BLOCKLIST);
      expect(result.sourceFiles).toHaveLength(1);
      expect(result.sourceFiles[0].content).toBe('CLASS /test/class DEFINITION PUBLIC.');
      expect(result.sourceFiles[0].originalFilename).toBe('CPUB /TEST/CLASS.abap');
    });
  });

  describe('validateConsistency', () => {
    it('should report no warnings when data and nametab match', () => {
      const obj: GctsObjectData = {
        objectType: 'TABL',
        objectName: '/T/T',
        tables: [
          { table: 'DD02L', data: [{ TABNAME: '/T/T', EXCLASS: 1 }] },
        ],
        sourceFiles: [],
      };
      const nametabs: NametabDefinition[] = [
        {
          table: 'DD02L',
          nametab: [
            { NAME: 'TABNAME', KEY: 'X', TYPE: 'C', LENGTH: 30, DECIMALS: -1 },
            { NAME: 'EXCLASS', KEY: '', TYPE: 'N', LENGTH: 1, DECIMALS: -1 },
          ],
          properties: [],
        },
      ];

      const warnings = validateConsistency(obj, nametabs);
      expect(warnings).toHaveLength(0);
    });

    it('should report warning for field in data but not nametab', () => {
      const obj: GctsObjectData = {
        objectType: 'TABL',
        objectName: '/T/T',
        tables: [
          { table: 'DD02L', data: [{ TABNAME: '/T/T', EXTRA: 'yes' }] },
        ],
        sourceFiles: [],
      };
      const nametabs: NametabDefinition[] = [
        {
          table: 'DD02L',
          nametab: [
            { NAME: 'TABNAME', KEY: 'X', TYPE: 'C', LENGTH: 30, DECIMALS: -1 },
          ],
          properties: [],
        },
      ];

      const warnings = validateConsistency(obj, nametabs);
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings.some(w => w.includes('EXTRA'))).toBe(true);
    });
  });
});
