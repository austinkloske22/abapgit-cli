/**
 * CLI convert command.
 *
 * Usage:
 *   abapgit-cli convert --from gcts --to abapgit -i ./objects -o ./output
 */

import type { CommandModule } from 'yargs';
import { createDefaultRegistry } from '../../core/registry.js';
import { ConversionPipeline } from '../../core/pipeline.js';
import type { ConversionDirection } from '../../core/types.js';

interface ConvertArgs {
  from: string;
  to: string;
  input: string;
  output: string;
  types?: string;
  strict?: boolean;
  verbose?: boolean;
  'dry-run'?: boolean;
}

export const convertCommand: CommandModule<object, ConvertArgs> = {
  command: 'convert',
  describe: 'Convert between gCTS and abapGit serialization formats',
  builder: {
    from: {
      type: 'string',
      demandOption: true,
      choices: ['gcts', 'abapgit'],
      describe: 'Source format',
    },
    to: {
      type: 'string',
      demandOption: true,
      choices: ['gcts', 'abapgit'],
      describe: 'Target format',
    },
    input: {
      alias: 'i',
      type: 'string',
      demandOption: true,
      describe: 'Path to source directory (objects/ for gCTS, src/ for abapGit)',
    },
    output: {
      alias: 'o',
      type: 'string',
      demandOption: true,
      describe: 'Path to output directory',
    },
    types: {
      type: 'string',
      describe: 'Comma-separated list of object types to convert (e.g., TABL,DDLS,CLAS)',
    },
    strict: {
      type: 'boolean',
      default: false,
      describe: 'Fail on unsupported object types instead of skipping',
    },
    verbose: {
      alias: 'v',
      type: 'boolean',
      default: false,
      describe: 'Show detailed conversion log',
    },
    'dry-run': {
      type: 'boolean',
      default: false,
      describe: 'Show what would be converted without writing files',
    },
  },
  handler: (argv) => {
    const direction: ConversionDirection = `${argv.from}-to-${argv.to}` as ConversionDirection;
    const types = argv.types?.split(',').map(t => t.trim().toUpperCase());

    const registry = createDefaultRegistry();
    const pipeline = new ConversionPipeline(registry, {
      inputPath: argv.input,
      outputPath: argv.output,
      direction,
      types,
      strictMode: argv.strict,
      verbose: argv.verbose,
      dryRun: argv['dry-run'],
    });

    console.log(`Converting ${argv.from} → ${argv.to}`);
    console.log(`  Input:  ${argv.input}`);
    console.log(`  Output: ${argv.output}`);
    if (types) console.log(`  Types:  ${types.join(', ')}`);
    if (argv['dry-run']) console.log(`  (DRY RUN — no files will be written)`);
    console.log('');

    const report = pipeline.run();

    // Summary
    console.log('');
    console.log(`Converted: ${report.converted.length}`);
    if (report.skipped.length > 0) {
      console.log(`Skipped:   ${report.skipped.length}`);
      for (const s of report.skipped) {
        console.log(`  - ${s.objectType} ${s.objectName}: ${s.reason}`);
      }
    }
    if (report.errors.length > 0) {
      console.log(`Errors:    ${report.errors.length}`);
      for (const e of report.errors) {
        console.error(`  ✗ ${e.objectType} ${e.objectName}: ${e.error}`);
      }
      process.exitCode = 1;
    }
  },
};
