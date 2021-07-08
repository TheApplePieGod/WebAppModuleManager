
const path = require('path');
const { IgnorePlugin } = require('webpack');

var config = {
  entry: './src/electron/electron.js',
  target: 'electron-main',
  devtool: 'source-map',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
    {
      test: /\.ts(x?)$/,
      include: /src\\electron/,
      exclude: /modules/,
      use: [{ loader: 'ts-loader' }]
    },
    {
      test: /\.node$/,
      exclude: /modules/,
      loader: 'node-loader'
    }
  ]
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'electron.js'
  },
  plugins: [
    new IgnorePlugin(/bufferutil/),    
    new IgnorePlugin(/utf-8-validate/),
  ],
  experiments: {
    topLevelAwait: true
  }
};

module.exports = config;