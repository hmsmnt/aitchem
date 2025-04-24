#!/usr/bin/env node

import { runFile } from '../lib/runner.js';

const file = process.argv[2];
if (!file) {
  console.error('❌  Usa: hm <file.hm>');
  process.exit(1);
}

await runFile(file);
