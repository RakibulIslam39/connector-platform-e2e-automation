'use strict';

module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  bracketSpacing: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  overrides: [
    {
      files: ['*.json'],
      options: {
        printWidth: 120,
      },
    },
    {
      files: ['*.md'],
      options: {
        proseWrap: 'always',
        printWidth: 80,
      },
    },
  ],
};
