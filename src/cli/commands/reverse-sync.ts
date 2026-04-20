/**
 * CLI reverse-sync command.
 *
 * Syncs BTP gCTS objects to D10 format:
 *   - Normalizes TADIR: CPROJECT " S" → " L", CRELEASE "100" → "", COMPONENT → ""
 *   - Strips FINGERPRINT.json files (D10 doesn't use them)
 *   - All object data and nametabs pass through unchanged
 */

import type { CommandModule } from 'yargs';
import { readAllObjects } from '../../formats/gcts/reader.js';
import { sanitizeObject } from '../../sanitizer/sanitizer.js';
import { D10_TADIR } from '../../sanitizer/field-blocklist.js';
import { writeAllObjects } from '../../sanitizer/gcts-writer.js';

interface ReverseSyncArgs {
  input: string;
  output: string;
  verbose?: boolean;
}

export const reverseSyncCommand: CommandModule<object, ReverseSyncArgs> = {
  command: 'reverse-sync',
  describe: 'Sync BTP gCTS objects to D10 format (strip fingerprints, normalize TADIR)',
  builder: {
    input: {
      alias: 'i',
      type: 'string',
      demandOption: true,
      describe: 'Path to BTP gCTS objects/ directory',
    },
    output: {
      alias: 'o',
      type: 'string',
      demandOption: true,
      describe: 'Path to output directory',
    },
    verbose: {
      alias: 'v',
      type: 'boolean',
      default: false,
      describe: 'Show detailed log',
    },
  },
  handler: (argv) => {
    console.log('Reverse sync: BTP → D10');
    console.log(`  Input:  ${argv.input}`);
    console.log(`  Output: ${argv.output}`);
    console.log('');
    console.log('TADIR normalization:');
    console.log(`  CPROJECT → "${D10_TADIR.cproject}"`);
    console.log(`  CRELEASE → "${D10_TADIR.crelease}"`);
    console.log(`  COMPONENT → "${D10_TADIR.component}"`);
    console.log('  FINGERPRINT.json → stripped');
    console.log('');

    const objects = readAllObjects(argv.input);
    console.log(`Read ${objects.length} objects`);

    const normalized = objects.map(obj => {
      const cleaned = sanitizeObject(obj, D10_TADIR);
      if (argv.verbose) {
        console.log(`  ✓ ${obj.objectType} ${obj.objectName}`);
      }
      return cleaned;
    });

    // Write objects WITHOUT FINGERPRINT.json files
    // (writeAllObjects only writes .asx.json and .abap files, never FINGERPRINT.json)
    writeAllObjects(normalized, { outputDir: argv.output });

    console.log('');
    console.log(`Wrote ${normalized.length} objects to ${argv.output}`);
    console.log('FINGERPRINT.json files excluded (D10 does not use them)');
  },
};
