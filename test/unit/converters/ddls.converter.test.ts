import { describe, it, expect } from 'vitest';
import { readObject } from '../../../src/formats/gcts/reader.js';
import { DdlsConverter } from '../../../src/converters/ddls.converter.js';
import * as path from 'node:path';

const FIXTURES = path.resolve('test/fixtures/gcts');
const converter = new DdlsConverter();

describe('DdlsConverter', () => {
  describe('toAbapGit — /COSS/R_EVENT', () => {
    const gctsObj = readObject(
      path.join(FIXTURES, 'DDLS', '%2FCOSS%2FR_EVENT'),
      'DDLS',
      '/COSS/R_EVENT',
    );
    const result = converter.toAbapGit(gctsObj);

    it('should produce XML with DDLS metadata', () => {
      expect(result.xmlContent).toContain('<DDLNAME>/COSS/R_EVENT</DDLNAME>');
      expect(result.xmlContent).toContain('<DDLANGUAGE>E</DDLANGUAGE>');
      expect(result.xmlContent).toContain('serializer="LCL_OBJECT_DDLS"');
    });

    it('should include description text from DDDDLSRCT', () => {
      expect(result.xmlContent).toContain('View Entity for /COSS/EVENT');
    });

    it('should produce a separate .asddls source file', () => {
      expect(result.additionalFiles).toHaveLength(1);
      const sourceFile = result.additionalFiles[0];
      expect(sourceFile.filename).toBe('#coss#r_event.ddls.asddls');
    });

    it('should have clean CDS source without runtime metadata', () => {
      const source = result.additionalFiles[0].content;
      expect(source).toContain('define root view entity /COSS/R_EVENT');
      expect(source).not.toContain('/*+[internal]');
      expect(source).not.toContain('BASEINFO');
    });

    it('should NOT include runtime tables in XML', () => {
      expect(result.xmlContent).not.toContain('DDFIELDANNO');
      expect(result.xmlContent).not.toContain('DDHEADANNO');
      expect(result.xmlContent).not.toContain('DDLDEPENDENCY');
    });
  });

  describe('toAbapGit — /COSS/C_EVENT (projection)', () => {
    const gctsObj = readObject(
      path.join(FIXTURES, 'DDLS', '%2FCOSS%2FC_EVENT'),
      'DDLS',
      '/COSS/C_EVENT',
    );
    const result = converter.toAbapGit(gctsObj);

    it('should include SOURCE_TYPE for projections', () => {
      expect(result.xmlContent).toContain('<SOURCE_TYPE>P</SOURCE_TYPE>');
    });

    it('should have CDS source with projection keyword', () => {
      const source = result.additionalFiles[0].content;
      expect(source).toContain('as projection on /COSS/R_EVENT');
    });
  });
});
