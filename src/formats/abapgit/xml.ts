/**
 * abapGit XML builder and parser.
 *
 * abapGit uses a specific XML format with the SAP ABAP XML namespace.
 * Output must match abapGit's formatting exactly to be importable.
 */

const XML_HEADER = '<?xml version="1.0" encoding="utf-8"?>';
const ABAPGIT_VERSION = 'v1.0.0';

/** Build an abapGit-format XML document */
export function buildAbapGitXml(
  serializerClass: string,
  values: Record<string, unknown>,
): string {
  const lines: string[] = [
    XML_HEADER,
    `<abapGit version="${ABAPGIT_VERSION}" serializer="${serializerClass}" serializer_version="${ABAPGIT_VERSION}">`,
    ' <asx:abap xmlns:asx="http://www.sap.com/abapxml" version="1.0">',
    '  <asx:values>',
  ];

  serializeValues(values, 3, lines);

  lines.push(
    '  </asx:values>',
    ' </asx:abap>',
    '</abapGit>',
  );

  return lines.join('\n') + '\n';
}

/** Serialize a values object to XML elements */
function serializeValues(
  obj: Record<string, unknown>,
  indent: number,
  lines: string[],
): void {
  const pad = ' '.repeat(indent);

  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined || value === null) continue;

    if (Array.isArray(value)) {
      // Array of objects — each element is a child element with the same tag
      // The parent tag is the array key (e.g., DD03P_TABLE), children use singular (e.g., DD03P)
      lines.push(`${pad}<${key}>`);
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          const childObj = item as Record<string, unknown>;
          // Derive child tag: remove _TABLE suffix if present
          const childTag = key.endsWith('_TABLE')
            ? key.slice(0, -'_TABLE'.length)
            : key;
          lines.push(`${pad} <${childTag}>`);
          serializeValues(childObj, indent + 2, lines);
          lines.push(`${pad} </${childTag}>`);
        }
      }
      lines.push(`${pad}</${key}>`);
    } else if (typeof value === 'object') {
      // Nested object
      lines.push(`${pad}<${key}>`);
      serializeValues(value as Record<string, unknown>, indent + 1, lines);
      lines.push(`${pad}</${key}>`);
    } else {
      // Scalar value
      const strVal = escapeXml(String(value));
      lines.push(`${pad}<${key}>${strVal}</${key}>`);
    }
  }
}

/** Escape special characters for XML */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
