import { describe, it, expect } from 'vitest';
import { readObject } from '../../../src/formats/gcts/reader.js';
import { TablConverter } from '../../../src/converters/tabl.converter.js';
import * as path from 'node:path';

const FIXTURES = path.resolve('test/fixtures/gcts');
const converter = new TablConverter();

describe('TablConverter', () => {
  describe('toAbapGit — /COSS/EVENT', () => {
    const gctsObj = readObject(
      path.join(FIXTURES, 'TABL', '%2FCOSS%2FEVENT'),
      'TABL',
      '/COSS/EVENT',
    );
    const result = converter.toAbapGit(gctsObj);

    it('should set correct object type and name', () => {
      expect(result.objectType).toBe('TABL');
      expect(result.objectName).toBe('/COSS/EVENT');
    });

    it('should produce valid abapGit XML wrapper', () => {
      expect(result.xmlContent).toContain('<?xml version="1.0" encoding="utf-8"?>');
      expect(result.xmlContent).toContain('serializer="LCL_OBJECT_TABL"');
      expect(result.xmlContent).toContain('<asx:abap xmlns:asx="http://www.sap.com/abapxml"');
    });

    it('should include DD02V with table name and class', () => {
      expect(result.xmlContent).toContain('<DD02V>');
      expect(result.xmlContent).toContain('<TABNAME>/COSS/EVENT</TABNAME>');
      expect(result.xmlContent).toContain('<TABCLASS>TRANSP</TABCLASS>');
    });

    it('should merge DDTEXT from DD02T', () => {
      expect(result.xmlContent).toContain('<DDTEXT>Event Table</DDTEXT>');
      expect(result.xmlContent).toContain('<DDLANGUAGE>E</DDLANGUAGE>');
    });

    it('should STRIP system-specific fields from DD02L', () => {
      expect(result.xmlContent).not.toContain('QUOTA_MAX_FIELDS');
      expect(result.xmlContent).not.toContain('QUOTA_MAX_BYTES');
      expect(result.xmlContent).not.toContain('QUOTA_SHARE_PARTNER');
      expect(result.xmlContent).not.toContain('QUOTA_SHARE_CUSTOMER');
      expect(result.xmlContent).not.toContain('HDB_ONLY_ENTITY_INCLUDED');
      expect(result.xmlContent).not.toContain('AS4USER');
      expect(result.xmlContent).not.toContain('AS4DATE');
      expect(result.xmlContent).not.toContain('AS4TIME');
    });

    it('should include DD03P_TABLE with field definitions', () => {
      expect(result.xmlContent).toContain('<DD03P_TABLE>');
      expect(result.xmlContent).toContain('<DD03P>');
      expect(result.xmlContent).toContain('<FIELDNAME>EVENT_UUID</FIELDNAME>');
      expect(result.xmlContent).toContain('<FIELDNAME>CLIENT</FIELDNAME>');
    });

    it('should have correct number of fields (12)', () => {
      const fieldCount = (result.xmlContent.match(/<DD03P>/g) || []).length;
      expect(fieldCount).toBe(12);
    });

    it('should include DD09L technical settings', () => {
      expect(result.xmlContent).toContain('<DD09L>');
      expect(result.xmlContent).toContain('<TABART>APPL0</TABART>');
    });

    it('should have no additional files (tables are XML only)', () => {
      expect(result.additionalFiles).toHaveLength(0);
    });
  });

  describe('validateGcts', () => {
    it('should validate a well-formed TABL object', () => {
      const gctsObj = readObject(
        path.join(FIXTURES, 'TABL', '%2FCOSS%2FEVENT'),
        'TABL',
        '/COSS/EVENT',
      );
      const result = converter.validateGcts(gctsObj);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
