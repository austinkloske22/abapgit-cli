export class ConversionError extends Error {
  constructor(
    public readonly objectType: string,
    public readonly objectName: string,
    message: string,
  ) {
    super(`[${objectType}] ${objectName}: ${message}`);
    this.name = 'ConversionError';
  }
}

export class UnsupportedTypeError extends Error {
  constructor(public readonly objectType: string) {
    super(`No converter registered for object type: ${objectType}`);
    this.name = 'UnsupportedTypeError';
  }
}

export class ParseError extends Error {
  constructor(
    public readonly filePath: string,
    message: string,
  ) {
    super(`Failed to parse ${filePath}: ${message}`);
    this.name = 'ParseError';
  }
}
