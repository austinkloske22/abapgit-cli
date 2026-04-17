import { describe, it, expect } from 'vitest';
import {
  DEFAULT_BLOCKLIST,
  getBlockedFields,
  getBlockedTables,
} from '../../../src/sanitizer/field-blocklist.js';

describe('field-blocklist', () => {
  describe('DEFAULT_BLOCKLIST', () => {
    it('should block DD02L, DD03L, and DD09L tables', () => {
      const tables = getBlockedTables(DEFAULT_BLOCKLIST);
      expect(tables).toContain('DD02L');
      expect(tables).toContain('DD03L');
      expect(tables).toContain('DD09L');
      expect(tables).toHaveLength(3);
    });

    it('should block QUOTA_MAX_FIELDS in DD02L', () => {
      const blocked = getBlockedFields(DEFAULT_BLOCKLIST, 'DD02L');
      expect(blocked.has('QUOTA_MAX_FIELDS')).toBe(true);
    });

    it('should block QUOTA_MAX_BYTES in DD02L', () => {
      const blocked = getBlockedFields(DEFAULT_BLOCKLIST, 'DD02L');
      expect(blocked.has('QUOTA_MAX_BYTES')).toBe(true);
    });

    it('should block QUOTA_SHARE_PARTNER in DD02L', () => {
      const blocked = getBlockedFields(DEFAULT_BLOCKLIST, 'DD02L');
      expect(blocked.has('QUOTA_SHARE_PARTNER')).toBe(true);
    });

    it('should block QUOTA_SHARE_CUSTOMER in DD02L', () => {
      const blocked = getBlockedFields(DEFAULT_BLOCKLIST, 'DD02L');
      expect(blocked.has('QUOTA_SHARE_CUSTOMER')).toBe(true);
    });

    it('should block HDB_ONLY_ENTITY_INCLUDED in DD02L', () => {
      const blocked = getBlockedFields(DEFAULT_BLOCKLIST, 'DD02L');
      expect(blocked.has('HDB_ONLY_ENTITY_INCLUDED')).toBe(true);
    });

    it('should block FIELD_SUFFIX in DD02L', () => {
      const blocked = getBlockedFields(DEFAULT_BLOCKLIST, 'DD02L');
      expect(blocked.has('FIELD_SUFFIX')).toBe(true);
    });

    it('should block PK_IS_INVHASH in DD02L', () => {
      const blocked = getBlockedFields(DEFAULT_BLOCKLIST, 'DD02L');
      expect(blocked.has('PK_IS_INVHASH')).toBe(true);
    });

    it('should block all 22 D10-specific DD02L fields', () => {
      const blocked = getBlockedFields(DEFAULT_BLOCKLIST, 'DD02L');
      const expected = [
        'QUOTA_MAX_FIELDS', 'QUOTA_MAX_BYTES', 'QUOTA_SHARE_PARTNER',
        'QUOTA_SHARE_CUSTOMER', 'HDB_ONLY_ENTITY_INCLUDED', 'FIELD_SUFFIX',
        'PK_IS_INVHASH', 'USED_SESSION_VARS', 'TBFUNC_INCLUDED',
        'SESSION_VAR_EX', 'FROM_ENTITY', 'VIEWREF_POS_CHG', 'VIEWREF_ERR',
        'VIEWREF', 'NONTRP_INCLUDED', 'TABLEN_FEATURE', 'KEYLEN_FEATURE',
        'KEYMAX_FEATURE', 'EXVIEW_INCLUDED', 'ALLDATAINCL', 'ALWAYSTRP',
        'WRONGCL',
      ];
      expect(blocked.size).toBe(22);
      for (const field of expected) {
        expect(blocked.has(field)).toBe(true);
      }
    });

    it('should block SRS_ID, OUTPUTSTYLE, ANONYMOUS, DBPOSITION in DD03L', () => {
      const blocked = getBlockedFields(DEFAULT_BLOCKLIST, 'DD03L');
      expect(blocked.size).toBe(4);
      expect(blocked.has('SRS_ID')).toBe(true);
      expect(blocked.has('OUTPUTSTYLE')).toBe(true);
      expect(blocked.has('ANONYMOUS')).toBe(true);
      expect(blocked.has('DBPOSITION')).toBe(true);
    });

    it('should block JAVAONLY and RESERVE in DD09L', () => {
      const blocked = getBlockedFields(DEFAULT_BLOCKLIST, 'DD09L');
      expect(blocked.size).toBe(2);
      expect(blocked.has('JAVAONLY')).toBe(true);
      expect(blocked.has('RESERVE')).toBe(true);
    });
  });

  describe('getBlockedFields', () => {
    it('should return empty set for tables not in blocklist', () => {
      const blocked = getBlockedFields(DEFAULT_BLOCKLIST, 'DD02T');
      expect(blocked.size).toBe(0);
    });

    it('should return empty set for unknown tables', () => {
      const blocked = getBlockedFields(DEFAULT_BLOCKLIST, 'NONEXISTENT');
      expect(blocked.size).toBe(0);
    });
  });
});
