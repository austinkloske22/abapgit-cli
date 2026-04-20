/**
 * CLI sanitize command.
 *
 * Normalizes TADIR metadata in gCTS objects for BTP ABAP Environment compatibility.
 * All object data and nametab schemas pass through unchanged — D10 and BTP use
 * identical gCTS formats. Only TADIR fields (CPROJECT, CRELEASE, COMPONENT) are
 * normalized to match BTP expectations.
 */

import type { CommandModule } from 'yargs';
import { readAllObjects } from '../../formats/gcts/reader.js';
import { readAllNametabs } from '../../sanitizer/nametab-reader.js';
import { sanitizeObject } from '../../sanitizer/sanitizer.js';
import { DEFAULT_TADIR_NORMALIZATION } from '../../sanitizer/field-blocklist.js';
import type { TadirNormalization } from '../../sanitizer/field-blocklist.js';
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
  component?: string;
  verbose?: boolean;
}

export const sanitizeCommand: CommandModule<object, SanitizeArgs> = {
  command: 'sanitize',
  describe: 'Normalize gCTS objects for BTP ABAP Environment (TADIR metadata)',
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
    component: {
      alias: 'c',
      type: 'string',
      default: '',
      describe: 'BTP software component package name (e.g., /COSS/_UNIFIED)',
    },
    verbose: {
      alias: 'v',
      type: 'boolean',
      default: false,
      describe: 'Show detailed log',
    },
  },
  handler: (argv) => {
    console.log('Normalizing gCTS objects for BTP compatibility');
    console.log(`  Input:     ${argv.input}`);
    console.log(`  Output:    ${argv.output}`);
    console.log(`  Metadata:  ${argv.metadata}`);
    console.log(`  Component: ${argv.component || '(not set)'}`);
    console.log('');

    const normalization: TadirNormalization = {
      ...DEFAULT_TADIR_NORMALIZATION,
      component: argv.component || DEFAULT_TADIR_NORMALIZATION.component,
    };

    console.log('TADIR normalization:');
    console.log(`  CPROJECT → "${normalization.cproject}"`);
    console.log(`  CRELEASE → "${normalization.crelease}"`);
    console.log(`  COMPONENT → "${normalization.component}"`);
    console.log('');

    // 1. Read source objects
    const objects = readAllObjects(argv.input);
    console.log(`Read ${objects.length} objects from source`);

    // 2. Normalize TADIR in each object (everything else passes through)
    const normalizedObjects = objects.map(obj => {
      const cleaned = sanitizeObject(obj, normalization);
      if (argv.verbose) {
        console.log(`  ✓ ${obj.objectType} ${obj.objectName}`);
      }
      return cleaned;
    });

    // 3. Write objects (unchanged format, normalized TADIR)
    writeAllObjects(normalizedObjects, { outputDir: argv.output });

    // 4. Copy nametabs and objecttypes unchanged
    const nametabs = readAllNametabs(argv.metadata);
    writeNametabs(nametabs, argv.output);
    copyObjectTypes(argv.metadata, argv.output);
    copyUnaffectedNametabs(argv.metadata, argv.output, new Set());

    console.log('');
    console.log(`Wrote ${normalizedObjects.length} objects to ${argv.output}`);
    console.log(`Copied ${nametabs.length} nametab definitions (unchanged)`);
    console.log('');
    console.log('NOTE: .gcts.properties.json was NOT written (preserving target identity)');
  },
};
