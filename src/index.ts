// Public API
export { type GctsObjectData, type AbapgitObject, type ConversionOptions, type ConversionReport } from './core/types.js';
export { ConverterRegistry, createDefaultRegistry } from './core/registry.js';
export { readAllObjects, readObject, getFirstRow, getRows } from './formats/gcts/reader.js';
export { writeAll, writeObject } from './formats/abapgit/writer.js';
export { buildAbapGitXml } from './formats/abapgit/xml.js';
export { TablConverter } from './converters/tabl.converter.js';
export { DdlsConverter } from './converters/ddls.converter.js';
export { ClasConverter } from './converters/clas.converter.js';
export { BdefConverter } from './converters/bdef.converter.js';

// Sanitizer API
export { DEFAULT_TADIR_NORMALIZATION, type TadirNormalization } from './sanitizer/field-blocklist.js';
export { sanitizeObject, sanitizeTableBlock, type NametabDefinition, type NametabField } from './sanitizer/sanitizer.js';
export { writeAllObjects as writeGctsObjects, writeNametabs, copyObjectTypes } from './sanitizer/gcts-writer.js';
export { readAllNametabs, readNametab } from './sanitizer/nametab-reader.js';
