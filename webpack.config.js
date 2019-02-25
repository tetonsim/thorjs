const path = require('path');
const webpack = require('webpack');

let externals = {
  xmlhttprequest: 'XMLHttpRequest'  
}

externals['node-localstorage'] = 'localStorage';

base_config = {
  entry: './src/thor.js',
  target: 'web',
  externals: externals,
  plugins: [
    new webpack.IgnorePlugin(/xmlhttprequest/)
  ],
  node: {
    fs: 'empty',
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

Object.assign(prod_config, base_config);

dev_config = {
  mode: 'development',
  output: {
    filename: 'thor.dev.js',
    library: 'thor',
    path: path.resolve(__dirname, 'build')
  }
};

Object.assign(dev_config, base_config);

module.exports = [prod_config, dev_config];