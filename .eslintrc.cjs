module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true }
  },
  settings: {
    react: { version: 'detect' }
  },
  ignorePatterns: ['public/', 'dist/', 'scripts/ingest/schema/*.json'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/jsx-uses-react': 'off',
    'react/prop-types': 'off',
    'react/no-unknown-property': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-empty-object-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    'no-useless-escape': 'off'
  },
  overrides: [
    {
      files: ['scripts/ingest/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        'no-console': 'off'
      }
    },
    {
      files: ['src/legacy/**/*.{ts,tsx,js,jsx}'],
      rules: {
        'no-console': 'off'
      }
    }
  ]
};
