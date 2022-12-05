module.exports = {
  root: true,
  parser: "babel-eslint",
  parserOptions: {
    'sourceType': 'module',
    'ecmaVersion': 2019,
  },
  env: {
    'es6': true,
    'browser': true,
  },

  plugins: [
    'svelte3',
    'mocha',
    'json',
    'import',
  ],

  overrides: [
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3'
    }
  ],

  settings: {
    'svelte3/ignore-styles': (attributes) => attributes.lang == 'scss',
  },

  ignorePatterns: [
    '!.eslintrc.js',
    'node_modules/**',
    'dist/**',
    'builds/**',
    'docs/**',
    'tools/**',
    'src/_locales/**',
    'src/assets/**',
  ],

  rules: {
    'arrow-parens': 'error',
    'no-mixed-operators': 'error',
    'semi': ['error'],
    'indent': ["error", 2],
    'import/default': 'error',
    'import/export': 'error',
    'import/named': 'error',
    'import/namespace': 'error',
    'import/newline-after-import': 'error',
    'import/no-absolute-path': 'error',
    'import/no-amd': 'error',
    'import/no-anonymous-default-export': ['error', { 'allowObject': true }],
    'import/no-dynamic-require': 'error',
    'import/no-named-as-default': 'error',
    'import/no-named-as-default-member': 'error',
    'import/no-named-default': 'error',
    'import/no-self-import': 'error',
    'import/no-unused-modules': 'error',
    'import/no-webpack-loader-syntax': 'error',
    'mocha/no-setup-in-describe': 'off',
    'no-mixed-operators': 'off'
  },
};
