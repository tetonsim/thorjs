const path = require('path');
const webpack = require('webpack');
const pjson = require('./package.json');

let version = pjson.version;

if (process.env.BUILD_NUMBER) {
  version = version + '.' + process.env.BUILD_NUMBER;
}

let externals = {
  xmlhttprequest: 'XMLHttpRequest',
  three: 'THREE'
};

externals['node-localstorage'] = 'localStorage';

let definitions = new webpack.DefinePlugin(
  {
    THOR_VERSION: JSON.stringify(version)
  }
);

base_web_config = {
  entry: './src/thor.js',
  target: 'web',
  externals: externals,
  plugins: [
    new webpack.IgnorePlugin(/xmlhttprequest/),
    definitions
  ],
  node: {
    fs: 'empty',
    os: 'empty',
    path: 'empty',
    child_process: 'empty'
  }
};

prod_config = {
  mode: 'production',
  output: {
    filename: 'thor.js',
    library: 'thor',
    path: path.resolve(__dirname, 'build')
  }
};

Object.assign(prod_config, base_web_config);

dev_config = {
  mode: 'development',
  output: {
    filename: 'thor.dev.js',
    library: 'thor',
    path: path.resolve(__dirname, 'build')
  }
};

Object.assign(dev_config, base_web_config);

cli_config = {
  entry: './src/cli.js',
  target: 'node',
  mode: 'production',
  externals: {
    three: 'THREE'
  },
  output: {
    filename: 'thor.cli.js',
    //library: 'thor',
    path: path.resolve(__dirname, 'build')
  },
  plugins: [
    definitions
  ]
};

module.exports = [prod_config, dev_config, cli_config];