module.exports = {
  ignores: ['node_modules', 'dist', 'coverage', '.pnp', '.pnpm-debug.log'],
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  plugins: {
    '@typescript-eslint': require('@typescript-eslint/eslint-plugin')
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.cjs', '**/*.mjs'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      },
      rules: {
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
        'no-console': 'warn'
      }
    }
  ]
};
