import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';
import replace from '@rollup/plugin-replace';
import serve from 'rollup-plugin-serve';
import copy from 'rollup-plugin-copy-merge';
import watchAssets from 'rollup-plugin-watch-assets';
import postcss from 'rollup-plugin-postcss';
import svelte from 'rollup-plugin-svelte';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import livereload from 'rollup-plugin-livereload';
import preprocess from 'svelte-preprocess';

const production = !process.env.ROLLUP_WATCH;
function onwarn(warning) {
  if (warning.code !== 'CIRCULAR_DEPENDENCY') { // due to ton-core, workaround on 04/11/2023
      console.error(`(!) ${warning.message} \n${warning.frame}`);
  }
}

const config = [{
  onwarn,
  input: 'src/popup.js',
  output: {
    file: 'dist/popup.js',
    name: 'popup',
    format: 'iife'
  },
  plugins: [
    svelte({
      emitCss: true,
      preprocess: preprocess()
    }),
    // add the postccs plugin
    postcss({
      extract: true,
      minimize: production,
      sourceMap: !production
    }),
    copy({
      targets: [
        { src: 'src/manifest.json', dest: 'dist/' },
        { src: 'src/*.html', dest: 'dist/' },
        { src: 'src/_locales', dest: 'dist/' },
        { src: 'src/assets', dest: 'dist/' },
        { src: 'src/browser-polyfill.js', dest: 'dist/' },
        { src: './node_modules/chota/dist/chota.min.css', dest: 'dist/' }
      ]
    }),
    commonjs(),
    nodePolyfills(),
    json(),
    !production && watchAssets({ assets: ['src'] }),
    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
    resolve({ browser: true }),
    replace({
      preventAssignment: true,
      values: {
        '__DEV_MODE__': !production,
      }
    })
  ],
  watch: {
    clearScreen: false
  }
},{
  onwarn,
  input: 'src/page.js',
  output: {
    file: 'dist/page.js',
    name: 'app',
    format: 'iife'
  },
  plugins: [
    svelte({
      emitCss: true,
      preprocess: preprocess()
    }),
    // add the postccs plugin
    postcss({
      extract: true,
      minimize: production,
      sourceMap: !production
    }),
    commonjs(),
    nodePolyfills(),
    json(),
    !production && watchAssets({ assets: ['src'] }),
    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
    resolve({ browser: true }),
    replace({
      preventAssignment: true,
      values: {
        '__DEV_MODE__': !production,
      }
    })
  ],
  watch: {
    clearScreen: false
  }
},{
  onwarn,
  input: 'src/content.js',
  output: {
    file: 'dist/content.js',
    name: 'content',
    format: 'iife'
  },
  plugins: [
    commonjs(),
    nodePolyfills(),
    json(),
    !production && watchAssets({ assets: ['src'] }),
    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
    resolve({ browser: true }),
    replace({
      preventAssignment: true,
      values: {
        '__DEV_MODE__': !production,
      }
    })
  ],
  watch: {
    clearScreen: false
  }
},{
  onwarn,
  input: 'src/inpage.js',
  output: {
    file: 'dist/inpage.js',
    name: 'content',
    format: 'iife'
  },
  plugins: [
    commonjs(),
    nodePolyfills(),
    json(),
    !production && watchAssets({ assets: ['src'] }),
    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
    resolve({ browser: true }),
    replace({
      preventAssignment: true,
      values: {
        '__DEV_MODE__': !production,
      }
    })
  ],
  watch: {
    clearScreen: false
  }
},{
  onwarn,
  input: 'src/background.js',
  output: {
    file: 'dist/background.js',
    name: 'background',
    format: 'iife'
  },
  plugins: [
    commonjs(),
    nodePolyfills(),
    json(),
    !production && watchAssets({ assets: ['src'] }),
    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
    resolve({ browser: true }),
    replace({
      preventAssignment: true,
      values: {
        '__DEV_MODE__': !production,
      }
    })
  ],
  watch: {
    clearScreen: false
  }
},{
  onwarn,
  input: 'src/background-wrapper.js',
  output: {
    file: 'dist/background-wrapper.js',
    name: 'background_wrapper',
    format: 'iife'
  },
  plugins: [
    commonjs(),
    nodePolyfills(),
    json(),
    !production && copy({targets: [{ src: 'dist/livereload.js', file: 'dist/background-wrapper.js' }]}),
    !production && watchAssets({ assets: ['src'] }),
    !production && serve('dist') && livereload({watch: 'dist', verbose: false}),
    // If we're building for production (npm run build
    // instead of npm run dev), minify
    production && terser(),
    resolve({ browser: true }),
    replace({
      preventAssignment: true,
      values: {
        '__DEV_MODE__': !production,
      }
    })

  ],
  watch: {
    clearScreen: false
  }
}
];

export default config;
