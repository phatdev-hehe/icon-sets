// https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint
// https://marketplace.visualstudio.com/items?itemName=biomejs.biome
// https://code.visualstudio.com/docs/typescript/typescript-refactoring#_code-actions-on-save
// https://github.com/jsx-eslint/eslint-plugin-react

module.exports = {
  extends: [
    'plugin:perfectionist/recommended-natural-legacy',
    'plugin:promise/recommended',
    'plugin:react/jsx-runtime',
    'plugin:@eslint-react/recommended-legacy'
  ],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: Object.fromEntries(
    // (automatically fixable)
    [
      'dot-notation',
      'eqeqeq',
      'logical-assignment-operators',
      'no-div-regex',
      'no-else-return',
      'no-extra-bind',
      'no-extra-boolean-cast',
      'no-extra-label',
      'no-implicit-coercion',
      'no-lonely-if',
      'no-regex-spaces',
      'no-undef-init',
      'no-unneeded-ternary',
      'no-unused-labels',
      'no-useless-computed-key',
      'no-useless-rename',
      'no-useless-return',
      'no-var',
      'object-shorthand',
      'operator-assignment',
      'prefer-arrow-callback',
      'prefer-const',
      'prefer-destructuring',
      'prefer-exponentiation-operator',
      'prefer-numeric-literals',
      'prefer-object-has-own',
      'prefer-object-spread',
      'prefer-template',
      'sort-vars',
      'strict',
      'unicode-bom',
      'yoda'
      // 'arrow-body-style'
      // 'capitalized-comments'
      // 'curly'
      // 'one-var'
      // 'sort-imports'
    ].map(rule => [rule, 'error'])
  )
}
