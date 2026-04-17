/** Direction of conversion */
export type ConversionDirection = 'gcts-to-abapgit' | 'abapgit-to-gcts';

/** A single gCTS table entry block from an .asx.json file */
export interface GctsTableBlock {
  table: string;
  data: Record<string, unknown>[];
}

/** A source file associated with a gCTS object (e.g., .abap files for classes) */
export interface GctsSourceFile {
  originalFilename: string;
  fileType: string; // CINC, CPUB, CPRI, CPRO, CLSD, REPS, METH, etc.
  content: string;
}

/** The parsed content of one gCTS object */
export interface GctsObjectData {
  objectType: string;  // TABL, DDLS, CLAS, etc.
  objectName: string;  // decoded: /COSS/EVENT
  tables: GctsTableBlock[];
  sourceFiles: GctsSourceFile[];
}

/** An output file in abapGit format */
export interface AbapgitFile {
  filename: string; // e.g., #coss#event.tabl.xml
  content: string;
}

/** The in-memory representation of a single SAP object in abapGit format */
export interface AbapgitObject {
  objectType: string;
  objectName: string;
  xmlContent: string;        // the main .xml file content
  additionalFiles: AbapgitFile[];  // source files (.abap, .asddls, etc.)
}

/** Field mapping entry for converting between table formats */
export interface FieldMapEntry {
  source: string;
  target: string;
  omitWhenEmpty?: boolean;
  transform?: (value: unknown) => unknown;
}

/** Validation result from a converter */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/** Result of a full conversion run */
export interface ConversionReport {
  converted: Array<{ source: string; objectType: string; objectName: string }>;
  skipped: Array<{ objectType: string; objectName: string; reason: string }>;
  errors: Array<{ objectType: string; objectName: string; error: string }>;
}

/** Options for the conversion pipeline */
export interface ConversionOptions {
  inputPath: string;
  outputPath: string;
  direction: ConversionDirection;
  types?: string[];      // filter to specific object types
  strictMode?: boolean;  // fail on unsupported types instead of skipping
  verbose?: boolean;
  dryRun?: boolean;
}
