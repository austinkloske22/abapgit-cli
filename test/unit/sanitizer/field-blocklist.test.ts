import { describe, it, expect } from 'vitest';
import { DEFAULT_TADIR_NORMALIZATION } from '../../../src/sanitizer/field-blocklist.js';

describe('TADIR normalization config', () => {
  it('should have CPROJECT set to " S" for SAP Cloud', () => {
    expect(DEFAULT_TADIR_NORMALIZATION.cproject).toBe(' S');
  });

  it('should have CRELEASE set to "100"', () => {
    expect(DEFAULT_TADIR_NORMALIZATION.crelease).toBe('100');
  });

  it('should have empty COMPONENT as default (must be set per-project)', () => {
    expect(DEFAULT_TADIR_NORMALIZATION.component).toBe('');
  });
});
