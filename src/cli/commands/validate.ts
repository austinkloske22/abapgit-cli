/**
 * CLI validate command.
 *
 * Usage:
 *   abapgit-cli validate --format gcts ./objects
 */

import type { CommandModule } from 'yargs';
import { createDefaultRegistry } from '../../core/registry.js';
import { readAllObjects } from '../../formats/gcts/reader.js';

interface ValidateArgs {
  format: string;
  path: string;
}

export const validateCommand: CommandModule<object, ValidateArgs> = {
  command: 'validate <path>',
  describe: 'Validate a gCTS or abapGit repository directory',
  builder: {
    format: {
      alias: 'f',
      type: 'string',
      demandOption: true,
      choices: ['gcts', 'abapgit'],
      describe: 'Format to validate',
    },
    path: {
      type: 'string',
      demandOption: true,
      describe: 'Path to the directory to validate',
    },
  },
  handler: (argv) => {
    if (argv.format !== 'gcts') {
      console.error('Only gcts validation is currently supported');
      process.exitCode = 1;
      return;
    }

    const registry = createDefaultRegistry();
    const objects = readAllObjects(argv.path);

    console.log(`Validating ${objects.length} objects in ${argv.path}`);
    console.log('');

    let totalErrors = 0;
    let totalWarnings = 0;

    for (const obj of objects) {
      const converter = registry.get(obj.objectType);
      if (!converter) {
        console.log(`  ? ${obj.objectType} ${obj.objectName} — no converter (skipped)`);
        continue;
      }

      const result = converter.validateGcts(obj);
      if (result.valid && result.warnings.length === 0) {
        console.log(`  ✓ ${obj.objectType} ${obj.objectName}`);
      } else {
        for (const err of result.errors) {
          console.error(`  ✗ ${obj.objectType} ${obj.objectName}: ${err}`);
          totalErrors++;
        }
        for (const warn of result.warnings) {
          console.warn(`  ⚠ ${obj.objectType} ${obj.objectName}: ${warn}`);
          totalWarnings++;
        }
      }
    }

    console.log('');
    console.log(`${objects.length} objects, ${totalErrors} errors, ${totalWarnings} warnings`);
    if (totalErrors > 0) process.exitCode = 1;
  },
};
