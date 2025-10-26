//@ts-check

'use strict';

const path = require('path');

/**@type {import('webpack').Configuration}*/
const config = {
  target: 'node', // VS Code extensions run in a Node.js-context
  mode: 'none', // 'production' or 'development' is set via CLI flags

  entry: './src/extension.ts', // The entry point of your extension
  output: {
    // The bundled file will be stored in the 'dist' folder
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
  },
  externals: {
    vscode: 'commonjs vscode', // The 'vscode' module is provided by the runtime and must not be bundled
  },
  resolve: {
    // Support reading TypeScript and JavaScript files
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
  devtool: 'nosources-source-map', // Creates source map without original source code
  infrastructureLogging: {
    level: "log", // Enables logging for webpack's progress
  },
};

module.exports = config;