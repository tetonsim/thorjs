const path = require('path');
const webpack = require('webpack');
require('dotenv').config();

const externals = {
  xmlhttprequest: 'XMLHttpRequest',
  three: 'THREE',
};

externals['node-localstorage'] = 'localStorage';

const definitions = new webpack.DefinePlugin(
  {
    THOR_VERSION: JSON.stringify(process.env.THOR_VERSION + '.' + process.env.THOR_REVISION_NUMBER),
  },
);

base_web_config = {
  entry: './src/thor.js',
  target: 'web',
  externals: externals,
  plugins: [
    new webpack.IgnorePlugin(/xmlhttprequest/),
    definitions,
  ],
  node: {
    fs: 'empty',
    os: 'empty',
    path: 'empty',
    child_process: 'empty',
  },
};

prod_config = {
  mode: 'production',
  output: {
    filename: 'thor.js',
    library: 'thor',
    path: path.resolve(__dirname, 'build'),
  },
};

Object.assign(prod_config, base_web_config);

dev_config = {
  mode: 'development',
  output: {
    filename: 'thor.dev.js',
    library: 'thor',
    path: path.resolve(__dirname, 'build'),
  },
};

Object.assign(dev_config, base_web_config);

cli_config = {
  entry: './src/cli.js',
  target: 'node',
  mode: 'production',
  externals: {
    three: 'THREE',
  },
  output: {
    filename: 'thor.cli.js',
    // library: 'thor',
    path: path.resolve(__dirname, 'build'),
  },
  plugins: [
    definitions,
  ],
};

module.exports = [prod_config, dev_config, cli_config];
