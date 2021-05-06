const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  context: __dirname,
  mode: 'production',
  entry: {
    trails: './src/main.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: 'Trails',
    libraryExport: 'Trails',
    libraryTarget: 'umd',
  },
  module: {
    rules: [{
      test: /\.m?js$/,
      exclude: /(node_modules|bower_components)/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
        },
      },
    }],
  },
  plugins: [
    // new BundleAnalyzerPlugin(),
  ],
  optimization: {
    minimizer: [new TerserPlugin({
      extractComments: false,
    })],
  },
};
