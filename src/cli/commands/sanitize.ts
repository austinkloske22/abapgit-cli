/**
 * CLI sanitize command.
 *
 * Usage:
 *   abapgit-cli sanitize -i ./source-objects -o ./target-repo --metadata ./source/.gctsmetadata
 *
 * Reads gCTS format from source, strips D10-specific fields from both object
 * data and nametab schemas, and outputs clean gCTS format to the target directory.
 * Preserves the target's .gcts.properties.json (never overwrites identity).
 */

import type { CommandModule } from 'yargs';
import { readAllObjects } from '../../formats/gcts/reader.js';
import { readAllNametabs } from '../../sanitizer/nametab-reader.js';
import { sanitizeObject, sanitizeNametab } from '../../sanitizer/sanitizer.js';
import { DEFAULT_BLOCKLIST, getBlockedTables } from '../../sanitizer/field-blocklist.js';
import {
  writeAllObjects,
  writeNametabs,
  copyObjectTypes,
  copyUnaffectedNametabs,
} from '../../sanitizer/gcts-writer.js';

interface SanitizeArgs {
  input: string;
  output: string;
  metadata: string;
  verbose?: boolean;
}

export const sanitizeCommand: CommandModule<object, SanitizeArgs> = {
  command: 'sanitize',
  describe: 'Sanitize gCTS objects by stripping D10-specific fields for BTP compatibility',
  builder: {
    input: {
      alias: 'i',
      type: 'string',
      demandOption: true,
      describe: 'Path to source gCTS objects/ directory',
    },
    output: {
      alias: 'o',
      type: 'string',
      demandOption: true,
      describe: 'Path to target output directory',
    },
    metadata: {
      type: 'string',
      demandOption: true,
      describe: 'Path to source .gctsmetadata/ directory',
    },
    verbose: {
      alias: 'v',
      type: 'boolean',
      default: false,
      describe: 'Show detailed sanitization log',
    },
  },
  handler: (argv) => {
    console.log('Sanitizing gCTS objects for BTP compatibility');
    console.log(`  Input:    ${argv.input}`);
    console.log(`  Output:   ${argv.output}`);
    console.log(`  Metadata: ${argv.metadata}`);
    console.log('');

    // 1. Read source objects
    const objects = readAllObjects(argv.input);
    console.log(`Read ${objects.length} objects from source`);

    // 2. Read nametab schemas
    const nametabs = readAllNametabs(argv.metadata);
    console.log(`Read ${nametabs.length} nametab definitions`);

    // 3. Sanitize objects
    const blocklist = DEFAULT_BLOCKLIST;
    const blockedTables = getBlockedTables(blocklist);
    console.log(`Blocklist tables: ${blockedTables.join(', ')}`);
    console.log('');

    const sanitizedObjects = objects.map(obj => {
      const cleaned = sanitizeObject(obj, blocklist);
      if (argv.verbose) {
        console.log(`  Sanitized: ${obj.objectType} ${obj.objectName}`);
      }
      return cleaned;
    });

    // 4. Sanitize nametabs that are in the blocklist
    const sanitizedNametabs = nametabs
      .filter(nt => blocklist.has(nt.table))
      .map(nt => sanitizeNametab(nt, blocklist));
    const sanitizedTableNames = new Set(sanitizedNametabs.map(nt => nt.table));

    console.log(`Sanitized ${sanitizedNametabs.length} nametab definitions`);

    // 5. Write sanitized output
    writeAllObjects(sanitizedObjects, { outputDir: argv.output });
    writeNametabs(sanitizedNametabs, argv.output);
    copyObjectTypes(argv.metadata, argv.output);
    copyUnaffectedNametabs(argv.metadata, argv.output, sanitizedTableNames);

    console.log('');
    console.log(`Wrote ${sanitizedObjects.length} objects to ${argv.output}`);
    console.log(`Wrote ${nametabs.length} nametab definitions`);
    console.log('');
    console.log('NOTE: .gcts.properties.json was NOT written (preserving target identity)');
  },
};
