const tseslint = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');
const importPlugin = require('eslint-plugin-import');
const prettierPlugin = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
  // Arquivos ignorados
  {
    ignores: ['dist', 'node_modules'],
  },

  // Configuração principal do TypeScript + ESLint
  {
    files: ['**/*.ts'],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
      },
    },

    plugins: {
      '@typescript-eslint': tseslint,
      import: importPlugin,
      prettier: prettierPlugin,
    },

    rules: {
      // Prettier integrado ao ESLint
      'prettier/prettier': 'warn',

      // Regras TS
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn'],

      // Organização de imports
      'import/order': [
        'warn',
        {
          alphabetize: { order: 'asc', caseInsensitive: true },
          'newlines-between': 'always',
        },
      ],
    },

    // Aqui é só adicionar o config importado do prettier (sem extends!)
    ...prettierConfig,
  },
];
