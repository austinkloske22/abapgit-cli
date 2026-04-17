/**
 * Field mapping: DD03L (gCTS raw field list) → DD03P (abapGit portable field list).
 *
 * Strips system-specific fields: TABNAME (implicit), DBPOSITION, ANONYMOUS, OUTPUTSTYLE, SRS_ID.
 */

import type { FieldMapEntry } from '../core/types.js';

export const DD03L_TO_DD03P: FieldMapEntry[] = [
  { source: 'FIELDNAME', target: 'FIELDNAME' },
  { source: 'POSITION',  target: 'POSITION' },
  { source: 'KEYFLAG',   target: 'KEYFLAG',   omitWhenEmpty: true },
  { source: 'MANDATORY', target: 'MANDATORY', omitWhenEmpty: true },
  { source: 'ROLLNAME',  target: 'ROLLNAME',  omitWhenEmpty: true },
  { source: 'CHECKTABLE', target: 'CHECKTABLE', omitWhenEmpty: true },
  { source: 'ADMINFIELD', target: 'ADMINFIELD', omitWhenEmpty: true },
  { source: 'INTTYPE',   target: 'INTTYPE' },
  { source: 'INTLEN',    target: 'INTLEN' },
  { source: 'REFTABLE',  target: 'REFTABLE',  omitWhenEmpty: true },
  { source: 'PRECFIELD', target: 'PRECFIELD', omitWhenEmpty: true },
  { source: 'REFFIELD',  target: 'REFFIELD',  omitWhenEmpty: true },
  { source: 'CONROUT',   target: 'CONROUT',   omitWhenEmpty: true },
  { source: 'NOTNULL',   target: 'NOTNULL',   omitWhenEmpty: true },
  { source: 'DATATYPE',  target: 'DATATYPE' },
  { source: 'LENG',      target: 'LENG' },
  { source: 'DECIMALS',  target: 'DECIMALS' },
  { source: 'DOMNAME',   target: 'DOMNAME',   omitWhenEmpty: true },
  { source: 'SHLPORIGIN', target: 'SHLPORIGIN', omitWhenEmpty: true },
  { source: 'TABLETYPE', target: 'TABLETYPE', omitWhenEmpty: true },
  { source: 'DEPTH',     target: 'DEPTH',     omitWhenEmpty: true },
  { source: 'COMPTYPE',  target: 'COMPTYPE',  omitWhenEmpty: true },
  { source: 'REFTYPE',   target: 'REFTYPE',   omitWhenEmpty: true },
  { source: 'LANGUFLAG', target: 'LANGUFLAG', omitWhenEmpty: true },
];
