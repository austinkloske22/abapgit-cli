/**
 * Field mapping: DD02L (gCTS raw table header) → DD02V (abapGit portable view).
 *
 * DD02L has ~54 fields. DD02V keeps only the portable subset (~20 fields).
 * System-specific fields (QUOTA_*, timestamps, activation flags) are stripped.
 */

import type { FieldMapEntry } from '../core/types.js';

export const DD02L_TO_DD02V: FieldMapEntry[] = [
  { source: 'TABNAME',   target: 'TABNAME' },
  { source: 'TABCLASS',  target: 'TABCLASS' },
  { source: 'CLIDEP',    target: 'CLIDEP',    omitWhenEmpty: true },
  { source: 'LANGDEP',   target: 'LANGDEP',   omitWhenEmpty: true },
  { source: 'MASTERLANG', target: 'MASTERLANG' },
  { source: 'CONTFLAG',  target: 'CONTFLAG',  omitWhenEmpty: true },
  { source: 'EXCLASS',   target: 'EXCLASS',   omitWhenEmpty: true },
  { source: 'AUTHCLASS', target: 'AUTHCLASS', omitWhenEmpty: true },
  { source: 'SQLTAB',    target: 'SQLTAB',    omitWhenEmpty: true },
  { source: 'BUFFERED',  target: 'BUFFERED',  omitWhenEmpty: true },
  { source: 'COMPRFLAG', target: 'COMPRFLAG', omitWhenEmpty: true },
  { source: 'MAINFLAG',  target: 'MAINFLAG',  omitWhenEmpty: true },
  { source: 'GLOBALFLAG', target: 'GLOBALFLAG', omitWhenEmpty: true },
  { source: 'SHLPEXI',   target: 'SHLPEXI',   omitWhenEmpty: true },
  { source: 'PROXYTYPE', target: 'PROXYTYPE', omitWhenEmpty: true },
  { source: 'MULTIPLEX', target: 'MULTIPLEX', omitWhenEmpty: true },
  { source: 'APPLCLASS', target: 'APPLCLASS', omitWhenEmpty: true },
  { source: 'VIEWCLASS', target: 'VIEWCLASS', omitWhenEmpty: true },
  { source: 'VIEWGRANT', target: 'VIEWGRANT', omitWhenEmpty: true },
  { source: 'WITH_PARAMETERS', target: 'WITH_PARAMETERS', omitWhenEmpty: true },
  { source: 'ABAP_LANGUAGE_VERSION', target: 'ABAP_LANGUAGE_VERSION', omitWhenEmpty: true },
];
