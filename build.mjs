#!/usr/bin/env node

import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const watch = process.argv.includes('--watch');

const config = {
  entryPoints: [join(__dirname, 'src', 'index.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: join(__dirname, 'dist', 'index.js'),
  format: 'esm',
  sourcemap: true,
  minify: !watch,
  keepNames: true,
};

if (watch) {
  const ctx = await esbuild.context(config);
  await ctx.watch();
} else {
  await esbuild.build(config);
}
