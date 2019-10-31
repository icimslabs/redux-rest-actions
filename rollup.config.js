import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import minify from 'rollup-plugin-babel-minify';
import builtins from 'rollup-plugin-node-builtins';
import analyze from 'rollup-plugin-analyzer';
import { terser } from "rollup-plugin-terser";

export default [
  // browser-friendly UMD build
  {
    input: 'src/main.js',
    output: {
      name: 'main',
      file: pkg.browser,
      format: 'umd',
    },
    plugins: [
      resolve({jsnext: true, preferBuiltins: true, browser: true}),
      commonjs(),
      babel({
        exclude: 'node_modules/**',
        runtimeHelpers: true
      }),
      minify(),
      json({}),
      builtins(),
      analyze({summaryOnly: true}),
      terser()
    ],
  },

  // CommonJS (for Node) and ES module (for bundlers) build.
  // (We could have three entries in the configuration array
  // instead of two, but it's quicker to generate multiple
  // builds from a single configuration where possible, using
  // an array for the `output` option, where we can specify
  // `file` and `format` for each target)
  {
    input: 'src/main.js',
    external: [],
    output: [
      { file: pkg.main, format: 'cjs' },
      { file: pkg.module, format: 'es' },
    ],
  },
];
