/**
 * Conversion pipeline — orchestrates reading, converting, and writing.
 */

import type { ConversionOptions, ConversionReport } from './types.js';
import type { ConverterRegistry } from './registry.js';
import { readAllObjects } from '../formats/gcts/reader.js';
import { writeObject } from '../formats/abapgit/writer.js';
import { UnsupportedTypeError } from './errors.js';

export class ConversionPipeline {
  constructor(
    private registry: ConverterRegistry,
    private options: ConversionOptions,
  ) {}

  run(): ConversionReport {
    const report: ConversionReport = { converted: [], skipped: [], errors: [] };

    if (this.options.direction !== 'gcts-to-abapgit') {
      report.errors.push({
        objectType: '*',
        objectName: '*',
        error: `Direction "${this.options.direction}" not yet implemented. Only gcts-to-abapgit is supported.`,
      });
      return report;
    }

    // Read all gCTS objects from input path
    const objects = readAllObjects(this.options.inputPath);

    if (this.options.verbose) {
      console.log(`Found ${objects.length} objects in ${this.options.inputPath}`);
    }

    for (const obj of objects) {
      // Filter by type if specified
      if (this.options.types && !this.options.types.includes(obj.objectType)) {
        continue;
      }

      const converter = this.registry.get(obj.objectType);

      if (!converter) {
        if (this.options.strictMode) {
          report.errors.push({
            objectType: obj.objectType,
            objectName: obj.objectName,
            error: new UnsupportedTypeError(obj.objectType).message,
          });
        } else {
          report.skipped.push({
            objectType: obj.objectType,
            objectName: obj.objectName,
            reason: `No converter for type: ${obj.objectType}`,
          });
        }
        continue;
      }

      try {
        // Validate first
        const validation = converter.validateGcts(obj);
        if (!validation.valid) {
          report.errors.push({
            objectType: obj.objectType,
            objectName: obj.objectName,
            error: validation.errors.join('; '),
          });
          continue;
        }

        // Convert
        const result = converter.toAbapGit(obj);

        // Write unless dry run
        if (!this.options.dryRun) {
          writeObject(this.options.outputPath, result);
        }

        report.converted.push({
          source: `${obj.objectType}/${obj.objectName}`,
          objectType: obj.objectType,
          objectName: obj.objectName,
        });

        if (this.options.verbose) {
          const fileCount = 1 + result.additionalFiles.length;
          console.log(`  ✓ ${obj.objectType} ${obj.objectName} → ${fileCount} file(s)`);
        }
      } catch (err) {
        report.errors.push({
          objectType: obj.objectType,
          objectName: obj.objectName,
          error: (err as Error).message,
        });
      }
    }

    return report;
  }
}
