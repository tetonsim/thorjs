const path = require('path');

module.exports = {
  entry: './src/thor.js',
  mode: 'production',
  target: 'web',
  output: {
    filename: 'thor.js',
    path: path.resolve(__dirname, 'build')
  },
  node: {
    fs: 'empty',
    child_process: 'empty'
  }
};