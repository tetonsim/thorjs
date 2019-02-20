const path = require('path');
const webpack = require('webpack');

module.exports = {
  entry: './src/thor.js',
  mode: 'production',
  target: 'web',
  externals: {
    xmlhttprequest: 'XMLHttpRequest'
  },
  plugins: [
    new webpack.IgnorePlugin(/xmlhttprequest/),
  ],
  output: {
    filename: 'thor.js',
    library: 'thor',
    path: path.resolve(__dirname, 'build')
  },
  node: {
    fs: 'empty',
    child_process: 'empty'
  }
};