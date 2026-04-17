#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { convertCommand } from '../src/cli/commands/convert.js';
import { validateCommand } from '../src/cli/commands/validate.js';

yargs(hideBin(process.argv))
  .scriptName('abapgit-cli')
  .usage('$0 <command> [options]')
  .command(convertCommand)
  .command(validateCommand)
  .demandCommand(1, 'Please specify a command')
  .strict()
  .help()
  .version()
  .parse();
