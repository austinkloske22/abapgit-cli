#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { convertCommand } from '../src/cli/commands/convert.js';
import { validateCommand } from '../src/cli/commands/validate.js';
import { sanitizeCommand } from '../src/cli/commands/sanitize.js';
import { reverseSyncCommand } from '../src/cli/commands/reverse-sync.js';

yargs(hideBin(process.argv))
  .scriptName('abapgit-cli')
  .usage('$0 <command> [options]')
  .command(convertCommand)
  .command(validateCommand)
  .command(sanitizeCommand)
  .command(reverseSyncCommand)
  .demandCommand(1, 'Please specify a command')
  .strict()
  .help()
  .version()
  .parse();
