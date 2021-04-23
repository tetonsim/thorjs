module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
    'node': true,
  },
  'extends': [
    'google',
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 12,
    'sourceType': 'module',
  },
  'plugins': [
    '@typescript-eslint',
  ],
  'rules': {
    'camelcase': 'off',
    'no-invalid-this': 'off',
    'max-len': 'off',
    'require-jsdoc': 'off',
    'indent': 'off',
    'no-extra-parens': 'off',
    'valid-jsdoc': 'off'
},
};
