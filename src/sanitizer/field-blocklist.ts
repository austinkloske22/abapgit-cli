/**
 * Field blocklist for sanitizing D10 (S/4HANA) gCTS objects for BTP ABAP Environment.
 *
 * BTP's internal tables do not have these fields. If a nametab defines them,
 * the gCTS import fails with "Object information could not be imported."
 *
 * For tables not listed here, all fields pass through unchanged.
 */

/** Map of DD table name to the set of field names to strip. */
export type FieldBlocklist = ReadonlyMap<string, ReadonlySet<string>>;

const DD02L_BLOCKED = new Set([
  'QUOTA_MAX_FIELDS',
  'QUOTA_MAX_BYTES',
  'QUOTA_SHARE_PARTNER',
  'QUOTA_SHARE_CUSTOMER',
  'HDB_ONLY_ENTITY_INCLUDED',
  'FIELD_SUFFIX',
  'PK_IS_INVHASH',
  'USED_SESSION_VARS',
  'TBFUNC_INCLUDED',
  'SESSION_VAR_EX',
  'FROM_ENTITY',
  'VIEWREF_POS_CHG',
  'VIEWREF_ERR',
  'VIEWREF',
  'NONTRP_INCLUDED',
  'TABLEN_FEATURE',
  'KEYLEN_FEATURE',
  'KEYMAX_FEATURE',
  'EXVIEW_INCLUDED',
  'ALLDATAINCL',
  'ALWAYSTRP',
  'WRONGCL',
]);

const DD03L_BLOCKED = new Set([
  'SRS_ID',
  'OUTPUTSTYLE',
  'ANONYMOUS',
  'DBPOSITION',
]);

const DD09L_BLOCKED = new Set([
  'JAVAONLY',
  'RESERVE',
]);

/** The default blocklist for D10 → BTP sanitization. */
export const DEFAULT_BLOCKLIST: FieldBlocklist = new Map<string, ReadonlySet<string>>([
  ['DD02L', DD02L_BLOCKED],
  ['DD03L', DD03L_BLOCKED],
  ['DD09L', DD09L_BLOCKED],
]);

/** Get the blocked field names for a given table, or an empty set if not blocklisted. */
export function getBlockedFields(
  blocklist: FieldBlocklist,
  tableName: string,
): ReadonlySet<string> {
  return blocklist.get(tableName) ?? new Set();
}

/** All blocked table names. */
export function getBlockedTables(blocklist: FieldBlocklist): string[] {
  return [...blocklist.keys()];
}
