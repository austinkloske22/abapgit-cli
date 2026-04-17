/**
 * abapGit naming utilities.
 *
 * abapGit uses # for namespace separators and lowercase filenames.
 * Example: /COSS/EVENT → #coss#event
 */

/** Convert SAP object name to abapGit filename base: /COSS/EVENT → #coss#event */
export function toAbapgitFilename(objectName: string): string {
  return objectName.replace(/\//g, '#').toLowerCase();
}

/** Convert abapGit filename base back to SAP object name: #coss#event → /COSS/EVENT */
export function fromAbapgitFilename(filename: string): string {
  return filename.replace(/#/g, '/').toUpperCase();
}

/** Map object type to main XML file extension */
export const XML_EXTENSION_MAP: Record<string, string> = {
  TABL: '.tabl.xml',
  DDLS: '.ddls.xml',
  CLAS: '.clas.xml',
  BDEF: '.bdef.xml',
  SRVD: '.srvd.xml',
  SRVB: '.srvb.xml',
  DCLS: '.dcls.xml',
  DDLX: '.ddlx.xml',
  DEVC: '.devc.xml',
  SICF: '.sicf.xml',
  SMIM: '.smim.xml',
  WAPA: '.wapa.xml',
  NONT: '.nont.xml',
  RONT: '.ront.xml',
  NSPC: '.nspc.xml',
  G4BA: '.g4ba.xml',
  SCO2: '.sco2.xml',
  SIA1: '.sia1.xml',
  SIA6: '.sia6.xml',
  SIA7: '.sia7.xml',
  SUSH: '.sush.xml',
  UIAD: '.uiad.xml',
};

/** Map object type to source file extension (for types that have separate source files) */
export const SOURCE_EXTENSION_MAP: Record<string, string> = {
  DDLS: '.ddls.asddls',
  BDEF: '.bdef.asbdef',
  DCLS: '.dcls.asdcls',
  DDLX: '.ddlx.asddlxs',
  SRVD: '.srvd.assrvd',
};

/** Map gCTS class source file types to abapGit class file extensions */
export const CLASS_FILE_MAP: Record<string, string> = {
  CCIMP: '.clas.locals_imp.abap',
  CCDEF: '.clas.locals_def.abap',
  CCMAC: '.clas.macros.abap',
  CCAU: '.clas.testclasses.abap',
};

/** Build the full abapGit filename for an object's main XML */
export function buildXmlFilename(objectType: string, objectName: string): string {
  const base = toAbapgitFilename(objectName);
  const ext = XML_EXTENSION_MAP[objectType] ?? `.${objectType.toLowerCase()}.xml`;
  return base + ext;
}

/** Build the full abapGit filename for an object's source file */
export function buildSourceFilename(objectType: string, objectName: string): string {
  const base = toAbapgitFilename(objectName);
  const ext = SOURCE_EXTENSION_MAP[objectType];
  if (!ext) throw new Error(`No source extension for type: ${objectType}`);
  return base + ext;
}
