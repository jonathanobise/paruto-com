#!/usr/bin/env node
// Build vendor/three/hero-three.min.js: a tree-shaken, minified ESM bundle of just the three.js classes the hero
// uses (see scripts/hero-three-entry.js), from the vendored three.js. Run after changing three.js or the entry:
//   npx -y esbuild@0.24.0 --version && node scripts/build-hero-three.mjs
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
const out = 'vendor/three/hero-three.min.js';
execFileSync('npx', ['-y', 'esbuild@0.24.0', 'scripts/hero-three-entry.js', '--bundle', '--format=esm', '--minify', '--target=es2020',
  '--alias:three=./vendor/three/three.module.min.js', `--outfile=${out}`, '--legal-comments=eof', '--log-level=warning'], { stdio: 'inherit' });
const size = statSync(out).size, gz = gzipSync(readFileSync(out)).length;
console.log(`✓ ${out}: ${(size / 1024).toFixed(0)} KB (${(gz / 1024).toFixed(0)} KB gzipped)`);
