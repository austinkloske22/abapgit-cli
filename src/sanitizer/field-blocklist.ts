/**
 * TADIR normalization rules for syncing between D10 and BTP ABAP Environment.
 *
 * D10 (S/4HANA Cloud) and BTP ABAP Environment have identical gCTS schemas
 * (55 DD02L fields, 31 DD03L fields, etc.) — NO fields need to be stripped.
 *
 * The only differences are in the TADIR metadata:
 *   CPROJECT: D10 uses " L", BTP uses " S" (SAP Cloud)
 *   CRELEASE: D10 leaves empty, BTP uses "100"
 *   COMPONENT: D10 leaves empty, BTP sets to the software component name
 *
 * Additionally, BTP generates FINGERPRINT.json files that D10 doesn't use.
 */

/** TADIR field values to normalize */
export interface TadirNormalization {
  cproject: string;
  crelease: string;
  component: string;
}

/** Normalize for BTP target (D10 → BTP) */
export const BTP_TADIR: TadirNormalization = {
  cproject: ' S',
  crelease: '100',
  component: '', // Set per-project (e.g., "/COSS/UNIFIED")
};

/** Normalize for D10 target (BTP → D10) */
export const D10_TADIR: TadirNormalization = {
  cproject: ' L',
  crelease: '',
  component: '',
};

// Keep backward compat
export const DEFAULT_TADIR_NORMALIZATION = BTP_TADIR;
