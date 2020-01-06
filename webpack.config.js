const webpack = require('webpack');
const path = require('path');
const tsImportPluginFactory = require('ts-import-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const devMode = process.env.NODE_ENV !== 'production'


module.exports = {
  entry: {index: './src/index.tsx'},
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      moment: `moment/moment.js`,
      "@ant-design/icons/lib/dist$": path.resolve(__dirname, "./src/icons.js")
    }
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        options: {
          transpileOnly: true,
          getCustomTransformers: () => ({
            before: [ tsImportPluginFactory({
              libraryName: 'antd',
              libraryDirectory: 'es',
              style: 'css'
            }) ]
          }),
          compilerOptions: {
            module: 'es2015'
          }
        },
        exclude: /node_modules/
      },
      {test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,loader: 'file-loader?limit=100000&name=[name].[ext]'},
      { test: /\.css$/, use: [
        devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
        'css-loader',
        'postcss-loader'
      ]}
    ]
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
  },

  plugins: [
    new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en/),
    new HtmlWebpackPlugin({
      template: './src/index.html'
    }),
    new MiniCssExtractPlugin({
      filename: devMode ? '[name].css' : '[name].[hash].css'
    }),
    new CopyWebpackPlugin([
      { from: 'static' }
    ]),
    // new BundleAnalyzerPlugin()
  ],

  optimization: {
    usedExports: true,
    splitChunks: {
      chunks: 'all'
    },
    minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})]
  },
  target: 'web'
};