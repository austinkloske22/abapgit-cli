/**
 * gCTS naming utilities.
 *
 * gCTS uses URL-encoded directory names (%2F for /) and spaces in filenames.
 * Example: objects/TABL/%2FCOSS%2FEVENT/TABL %2FCOSS%2FEVENT.asx.json
 */

/** Decode a gCTS URL-encoded name: %2FCOSS%2FEVENT → /COSS/EVENT */
export function decodeGctsName(encoded: string): string {
  return decodeURIComponent(encoded);
}

/** Encode an object name for gCTS directory/file names: /COSS/EVENT → %2FCOSS%2FEVENT */
export function encodeGctsName(name: string): string {
  return name.replace(/\//g, '%2F');
}

/**
 * Parse a gCTS filename into its components.
 *
 * Examples:
 *   "TABL %2FCOSS%2FEVENT.asx.json" → { prefix: "TABL", objectName: "/COSS/EVENT", suffix: "", extension: ".asx.json" }
 *   "CINC %2FCOSS%2FBP_C_EVENT==============CCIMP.abap" → { prefix: "CINC", objectName: "/COSS/BP_C_EVENT", suffix: "CCIMP", extension: ".abap" }
 *   "METH IF_OO_ADT_CLASSRUN%7EMAIN.abap" → { prefix: "METH", objectName: "IF_OO_ADT_CLASSRUN~MAIN", suffix: "", extension: ".abap" }
 */
export function parseGctsFilename(filename: string): {
  prefix: string;
  objectName: string;
  suffix: string;
  extension: string;
} {
  // Split on the first space to get prefix and rest
  const spaceIdx = filename.indexOf(' ');
  if (spaceIdx === -1) {
    // No space — might be a special case
    const dotIdx = filename.indexOf('.');
    return {
      prefix: dotIdx > 0 ? filename.substring(0, dotIdx) : filename,
      objectName: '',
      suffix: '',
      extension: dotIdx > 0 ? filename.substring(dotIdx) : '',
    };
  }

  const prefix = filename.substring(0, spaceIdx);
  const rest = filename.substring(spaceIdx + 1);

  // Determine extension (.asx.json or .abap)
  let extension: string;
  let nameAndSuffix: string;
  if (rest.endsWith('.asx.json')) {
    extension = '.asx.json';
    nameAndSuffix = rest.slice(0, -'.asx.json'.length);
  } else {
    const lastDot = rest.lastIndexOf('.');
    extension = lastDot >= 0 ? rest.substring(lastDot) : '';
    nameAndSuffix = lastDot >= 0 ? rest.substring(0, lastDot) : rest;
  }

  // Split on ==...== separator to get object name and suffix
  const eqMatch = nameAndSuffix.match(/^(.+?)=+(.+)$/);
  let objectName: string;
  let suffix: string;
  if (eqMatch) {
    objectName = decodeGctsName(eqMatch[1]);
    suffix = eqMatch[2];
  } else {
    objectName = decodeGctsName(nameAndSuffix);
    suffix = '';
  }

  return { prefix, objectName, suffix, extension };
}
