import { describe, it, expect } from 'vitest';
import { sanitizeObject, sanitizeTableBlock } from '../../../src/sanitizer/sanitizer.js';
import { DEFAULT_TADIR_NORMALIZATION } from '../../../src/sanitizer/field-blocklist.js';
import type { TadirNormalization } from '../../../src/sanitizer/field-blocklist.js';
import type { GctsTableBlock, GctsObjectData } from '../../../src/core/types.js';
import { readObject } from '../../../src/formats/gcts/reader.js';
import * as path from 'node:path';

const FIXTURES = path.resolve('test/fixtures/gcts');

const NORM: TadirNormalization = {
  cproject: ' S',
  crelease: '100',
  component: '/COSS/_UNIFIED',
};

describe('sanitizer', () => {
  describe('sanitizeTableBlock', () => {
    it('should normalize CPROJECT in TADIR from " L" to " S"', () => {
      const block: GctsTableBlock = {
        table: 'TADIR',
        data: [{ PGMID: 'R3TR', OBJECT: 'TABL', CPROJECT: ' L', CRELEASE: '', COMPONENT: '' }],
      };
      const result = sanitizeTableBlock(block, NORM);
      expect(result.data[0].CPROJECT).toBe(' S');
    });

    it('should normalize CRELEASE in TADIR from "" to "100"', () => {
      const block: GctsTableBlock = {
        table: 'TADIR',
        data: [{ PGMID: 'R3TR', OBJECT: 'TABL', CPROJECT: ' L', CRELEASE: '', COMPONENT: '' }],
      };
      const result = sanitizeTableBlock(block, NORM);
      expect(result.data[0].CRELEASE).toBe('100');
    });

    it('should set COMPONENT in TADIR to the software component package', () => {
      const block: GctsTableBlock = {
        table: 'TADIR',
        data: [{ PGMID: 'R3TR', OBJECT: 'TABL', CPROJECT: ' L', CRELEASE: '', COMPONENT: '' }],
      };
      const result = sanitizeTableBlock(block, NORM);
      expect(result.data[0].COMPONENT).toBe('/COSS/_UNIFIED');
    });

    it('should pass through DD02L completely unchanged', () => {
      const block: GctsTableBlock = {
        table: 'DD02L',
        data: [{
          TABNAME: '/COSS/EVENT',
          TABCLASS: 'TRANSP',
          QUOTA_MAX_FIELDS: 0,
          QUOTA_MAX_BYTES: 0,
          HDB_ONLY_ENTITY_INCLUDED: '',
          AS4LOCAL: 'L',
          EXCLASS: 1,
        }],
      };
      const result = sanitizeTableBlock(block, NORM);
      // ALL fields should be preserved — no stripping
      expect(result.data[0]).toHaveProperty('QUOTA_MAX_FIELDS', 0);
      expect(result.data[0]).toHaveProperty('QUOTA_MAX_BYTES', 0);
      expect(result.data[0]).toHaveProperty('HDB_ONLY_ENTITY_INCLUDED', '');
      expect(result.data[0]).toHaveProperty('AS4LOCAL', 'L');
      expect(result.data[0]).toHaveProperty('EXCLASS', 1);
    });

    it('should pass through DD03L completely unchanged', () => {
      const block: GctsTableBlock = {
        table: 'DD03L',
        data: [{
          FIELDNAME: 'MY_FIELD',
          SRS_ID: 0,
          OUTPUTSTYLE: 0,
          ANONYMOUS: '',
          DBPOSITION: 0,
        }],
      };
      const result = sanitizeTableBlock(block, NORM);
      expect(result.data[0]).toHaveProperty('SRS_ID', 0);
      expect(result.data[0]).toHaveProperty('OUTPUTSTYLE', 0);
      expect(result.data[0]).toHaveProperty('ANONYMOUS', '');
      expect(result.data[0]).toHaveProperty('DBPOSITION', 0);
    });

    it('should pass through DD09L completely unchanged', () => {
      const block: GctsTableBlock = {
        table: 'DD09L',
        data: [{ TABART: 'APPL0', JAVAONLY: '', RESERVE: '' }],
      };
      const result = sanitizeTableBlock(block, NORM);
      expect(result.data[0]).toHaveProperty('JAVAONLY', '');
      expect(result.data[0]).toHaveProperty('RESERVE', '');
    });

    it('should not mutate the original block', () => {
      const block: GctsTableBlock = {
        table: 'TADIR',
        data: [{ PGMID: 'R3TR', CPROJECT: ' L', CRELEASE: '', COMPONENT: '' }],
      };
      sanitizeTableBlock(block, NORM);
      expect(block.data[0].CPROJECT).toBe(' L');
      expect(block.data[0].CRELEASE).toBe('');
    });
  });

  describe('sanitizeObject with real fixtures', () => {
    it('should normalize TADIR in /COSS/EVENT table', () => {
      const obj = readObject(
        path.join(FIXTURES, 'TABL', '%2FCOSS%2FEVENT'),
        'TABL',
        '/COSS/EVENT',
      );
      const result = sanitizeObject(obj, NORM);

      const tadir = result.tables.find(t => t.table === 'TADIR');
      expect(tadir).toBeDefined();
      expect(tadir!.data[0].CPROJECT).toBe(' S');
      expect(tadir!.data[0].CRELEASE).toBe('100');
      expect(tadir!.data[0].COMPONENT).toBe('/COSS/_UNIFIED');
    });

    it('should preserve ALL 55 DD02L fields in /COSS/EVENT', () => {
      const obj = readObject(
        path.join(FIXTURES, 'TABL', '%2FCOSS%2FEVENT'),
        'TABL',
        '/COSS/EVENT',
      );
      const result = sanitizeObject(obj, NORM);

      const dd02l = result.tables.find(t => t.table === 'DD02L');
      expect(dd02l).toBeDefined();
      expect(Object.keys(dd02l!.data[0]).length).toBe(55);
      expect(dd02l!.data[0]).toHaveProperty('QUOTA_MAX_FIELDS');
      expect(dd02l!.data[0]).toHaveProperty('HDB_ONLY_ENTITY_INCLUDED');
      expect(dd02l!.data[0]).toHaveProperty('WRONGCL');
    });

    it('should preserve ALL 31 DD03L fields per row', () => {
      const obj = readObject(
        path.join(FIXTURES, 'TABL', '%2FCOSS%2FEVENT'),
        'TABL',
        '/COSS/EVENT',
      );
      const result = sanitizeObject(obj, NORM);

      const dd03l = result.tables.find(t => t.table === 'DD03L');
      expect(dd03l).toBeDefined();
      expect(Object.keys(dd03l!.data[0]).length).toBe(31);
      expect(dd03l!.data[0]).toHaveProperty('SRS_ID');
      expect(dd03l!.data[0]).toHaveProperty('DBPOSITION');
    });

    it('should preserve .abap source files unchanged', () => {
      const obj = readObject(
        path.join(FIXTURES, 'CLAS', '%2FCOSS%2FBP_C_EVENT'),
        'CLAS',
        '/COSS/BP_C_EVENT',
      );
      const result = sanitizeObject(obj, NORM);
      expect(result.sourceFiles.length).toBe(obj.sourceFiles.length);
      for (let i = 0; i < obj.sourceFiles.length; i++) {
        expect(result.sourceFiles[i].content).toBe(obj.sourceFiles[i].content);
      }
    });
  });
});
