import type { IObjectConverter } from '../converters/base-converter.js';
import { TablConverter } from '../converters/tabl.converter.js';
import { DdlsConverter } from '../converters/ddls.converter.js';
import { ClasConverter } from '../converters/clas.converter.js';
import { BdefConverter } from '../converters/bdef.converter.js';

export class ConverterRegistry {
  private converters = new Map<string, IObjectConverter>();

  register(converter: IObjectConverter): void {
    this.converters.set(converter.objectType, converter);
  }

  get(objectType: string): IObjectConverter | undefined {
    return this.converters.get(objectType);
  }

  has(objectType: string): boolean {
    return this.converters.has(objectType);
  }

  listTypes(): string[] {
    return [...this.converters.keys()];
  }
}

/** Create a registry with all built-in converters */
export function createDefaultRegistry(): ConverterRegistry {
  const registry = new ConverterRegistry();
  registry.register(new TablConverter());
  registry.register(new DdlsConverter());
  registry.register(new ClasConverter());
  registry.register(new BdefConverter());
  return registry;
}
