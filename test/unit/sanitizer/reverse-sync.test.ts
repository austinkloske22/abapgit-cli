import { describe, it, expect } from 'vitest';
import { sanitizeTableBlock, sanitizeObject } from '../../../src/sanitizer/sanitizer.js';
import { D10_TADIR, BTP_TADIR } from '../../../src/sanitizer/field-blocklist.js';
import type { GctsTableBlock } from '../../../src/core/types.js';
import { readObject } from '../../../src/formats/gcts/reader.js';
import * as path from 'node:path';

const FIXTURES = path.resolve('test/fixtures/gcts');

describe('reverse-sync: BTP → D10', () => {
  describe('TADIR normalization to D10 values', () => {
    it('should set CPROJECT to " L" for D10', () => {
      const block: GctsTableBlock = {
        table: 'TADIR',
        data: [{ PGMID: 'R3TR', CPROJECT: ' S', CRELEASE: '100', COMPONENT: '/COSS/UNIFIED' }],
      };
      const result = sanitizeTableBlock(block, D10_TADIR);
      expect(result.data[0].CPROJECT).toBe(' L');
    });

    it('should set CRELEASE to "" for D10', () => {
      const block: GctsTableBlock = {
        table: 'TADIR',
        data: [{ PGMID: 'R3TR', CPROJECT: ' S', CRELEASE: '100', COMPONENT: '/COSS/UNIFIED' }],
      };
      const result = sanitizeTableBlock(block, D10_TADIR);
      expect(result.data[0].CRELEASE).toBe('');
    });

    it('should set COMPONENT to "" for D10', () => {
      const block: GctsTableBlock = {
        table: 'TADIR',
        data: [{ PGMID: 'R3TR', CPROJECT: ' S', CRELEASE: '100', COMPONENT: '/COSS/UNIFIED' }],
      };
      const result = sanitizeTableBlock(block, D10_TADIR);
      expect(result.data[0].COMPONENT).toBe('');
    });
  });

  describe('roundtrip: D10 → BTP → D10', () => {
    it('should restore original D10 TADIR values after roundtrip', () => {
      const original: GctsTableBlock = {
        table: 'TADIR',
        data: [{ PGMID: 'R3TR', OBJECT: 'TABL', CPROJECT: ' L', CRELEASE: '', COMPONENT: '' }],
      };

      // D10 → BTP
      const btpNorm = { ...BTP_TADIR, component: '/COSS/UNIFIED' };
      const toBtp = sanitizeTableBlock(original, btpNorm);
      expect(toBtp.data[0].CPROJECT).toBe(' S');
      expect(toBtp.data[0].CRELEASE).toBe('100');

      // BTP → D10
      const backToD10 = sanitizeTableBlock(toBtp, D10_TADIR);
      expect(backToD10.data[0].CPROJECT).toBe(' L');
      expect(backToD10.data[0].CRELEASE).toBe('');
      expect(backToD10.data[0].COMPONENT).toBe('');
    });
  });

  describe('DD02L passes through unchanged in both directions', () => {
    it('should preserve all 55 DD02L fields in reverse sync', () => {
      const obj = readObject(
        path.join(FIXTURES, 'TABL', '%2FCOSS%2FEVENT'),
        'TABL',
        '/COSS/EVENT',
      );
      const result = sanitizeObject(obj, D10_TADIR);
      const dd02l = result.tables.find(t => t.table === 'DD02L');
      expect(dd02l).toBeDefined();
      expect(Object.keys(dd02l!.data[0]).length).toBe(55);
    });
  });
});
