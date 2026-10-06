const globals = require('globals')

module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  plugins: ['react', 'react-hooks'],
  settings: { react: { version: 'detect' } },
  globals: {
    __APP_VERSION__: 'readonly',
    __BUILD_DATE__: 'readonly',
    __DEV__: 'readonly',
  },
  ignorePatterns: ['dist/', 'node_modules/', 'scripts/'],
  overrides: [
    {
      // react-three-fiber JSX uses intrinsic 3D elements (mesh,
      // meshStandardMaterial…) whose props are not DOM properties.
      files: ['src/components/three/**'],
      rules: { 'react/no-unknown-property': 'off' },
    },
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-console': 'off',
  },
}
