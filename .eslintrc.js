module.exports = {
  'env': {
    'commonjs': true,
    'es2021': true,
    'node': true,
  },
  'extends': [
    'google',
  ],
  'parserOptions': {
    'ecmaVersion': 12,
  },
  'rules': {
    "indent": [2, 2],
    "camelcase":"off",
    "no-invalid-this": "off",
    "max-len": "off",
    "require-jsdoc": "off"
  },
};
