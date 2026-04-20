/**
 * TADIR normalization rules for D10 → BTP ABAP Environment.
 *
 * D10 (S/4HANA Cloud) and BTP ABAP Environment have identical gCTS schemas
 * (55 DD02L fields, 31 DD03L fields, etc.) — NO fields need to be stripped.
 *
 * The only differences are in the TADIR metadata:
 *   CPROJECT: D10 uses " L", BTP uses " S" (SAP Cloud)
 *   CRELEASE: D10 leaves empty, BTP uses "100"
 *   COMPONENT: D10 leaves empty, BTP sets to the software component package name
 *
 * These normalizations make D10 objects look like BTP-native objects.
 */

/** TADIR field values to normalize for BTP compatibility */
export interface TadirNormalization {
  /** CPROJECT value — BTP uses " S" for SAP Cloud */
  cproject: string;
  /** CRELEASE value — BTP uses "100" */
  crelease: string;
  /** COMPONENT value — the BTP software component package name */
  component: string;
}

/** Default TADIR normalization for BTP ABAP Environment */
export const DEFAULT_TADIR_NORMALIZATION: TadirNormalization = {
  cproject: ' S',
  crelease: '100',
  component: '', // Must be set per-project (e.g., "/COSS/_UNIFIED")
};

// Legacy exports for backward compatibility with tests
export type FieldBlocklist = ReadonlyMap<string, ReadonlySet<string>>;
export const DEFAULT_BLOCKLIST: FieldBlocklist = new Map();
export function getBlockedFields(_blocklist: FieldBlocklist, _tableName: string): ReadonlySet<string> {
  return new Set();
}
export function getBlockedTables(_blocklist: FieldBlocklist): string[] {
  return [];
}
