module.exports = {
  root: true,
  env: {
    browser: true,
    es2022: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  settings: {
    react: { version: 'detect' },
  },
  plugins: ['react', 'react-hooks'],
  globals: {
    __DEV__: 'readonly',
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'no-empty': ['error', { allowEmptyCatch: true }],
  },
  overrides: [
    {
      // react-three-fiber renders three.js elements (<mesh>, <ambientLight>…)
      // whose lowercase props (position, intensity, args…) are valid R3F
      // attributes, not DOM properties — disable the DOM-property rule there.
      files: ['src/components/three/**/*.jsx'],
      rules: {
        'react/no-unknown-property': 'off',
      },
    },
  ],
}

