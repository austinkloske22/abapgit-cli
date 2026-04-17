import { describe, it, expect, beforeAll } from 'vitest';
import { ConversionPipeline } from '../../src/core/pipeline.js';
import { createDefaultRegistry } from '../../src/core/registry.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

const FIXTURES = path.resolve('test/fixtures/gcts');

describe('Full Conversion Integration', () => {
  let outputDir: string;

  beforeAll(() => {
    outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'abapgit-cli-test-'));
    const pipeline = new ConversionPipeline(createDefaultRegistry(), {
      inputPath: FIXTURES,
      outputPath: outputDir,
      direction: 'gcts-to-abapgit',
    });
    const report = pipeline.run();
    // All supported types should convert without errors
    expect(report.errors).toHaveLength(0);
  });

  it('should convert TABL objects to .tabl.xml files', () => {
    expect(fs.existsSync(path.join(outputDir, '#coss#event.tabl.xml'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, '#coss#event_d.tabl.xml'))).toBe(true);
  });

  it('should convert DDLS objects to .ddls.xml + .asddls files', () => {
    expect(fs.existsSync(path.join(outputDir, '#coss#c_event.ddls.xml'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, '#coss#c_event.ddls.asddls'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, '#coss#r_event.ddls.xml'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, '#coss#r_event.ddls.asddls'))).toBe(true);
  });

  it('should convert CLAS objects with all source files', () => {
    expect(fs.existsSync(path.join(outputDir, '#coss#bp_c_event.clas.xml'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, '#coss#bp_c_event.clas.abap'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, '#coss#bp_c_event.clas.locals_imp.abap'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, '#coss#bp_c_event.clas.locals_def.abap'))).toBe(true);
  });

  it('should convert BDEF objects to .bdef.xml + .asbdef files', () => {
    expect(fs.existsSync(path.join(outputDir, '#coss#r_event.bdef.xml'))).toBe(true);
    expect(fs.existsSync(path.join(outputDir, '#coss#r_event.bdef.asbdef'))).toBe(true);
  });

  it('should produce valid abapGit XML in all output files', () => {
    const xmlFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.xml'));
    for (const file of xmlFiles) {
      const content = fs.readFileSync(path.join(outputDir, file), 'utf-8');
      expect(content).toContain('<?xml version="1.0" encoding="utf-8"?>');
      expect(content).toContain('<abapGit version="v1.0.0"');
      expect(content).toContain('</abapGit>');
    }
  });

  it('should never include TADIR in any output XML', () => {
    const xmlFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.xml'));
    for (const file of xmlFiles) {
      const content = fs.readFileSync(path.join(outputDir, file), 'utf-8');
      expect(content).not.toContain('<TADIR>');
    }
  });

  it('should never include system timestamps in any output XML', () => {
    const xmlFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.xml'));
    for (const file of xmlFiles) {
      const content = fs.readFileSync(path.join(outputDir, file), 'utf-8');
      expect(content).not.toContain('<AS4USER>');
      expect(content).not.toContain('<AS4DATE>');
    }
  });
});
