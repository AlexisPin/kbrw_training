var path = require('path'),
  MiniCssExtractPlugin = require('mini-css-extract-plugin'),
  CssMinimizerPlugin = require('css-minimizer-webpack-plugin')

var client_config = {
  devtool: 'source-map',
  optimization: {
    splitChunks: { cacheGroups: { styles: { name: 'styles', test: /\.css$/, chunks: 'all', enforce: true } } },
    minimizer: [`...`, new CssMinimizerPlugin()]
  },
  plugins: [new MiniCssExtractPlugin({ insert: "", filename: "[name].css" })],
  entry: "reaxt/client_entry_addition",
  output: {
    path: path.join(__dirname, '../priv/static'),
    filename: '[name].[fullhash].js',
    chunkFilename: 'chunk/client.[chunkhash].js',
    publicPath: '/public/'
  },
  module: {
    rules: [
      {
        test: /.js?$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ["@babel/preset-env", { "targets": "defaults" }],
              "@babel/preset-react",
              ["@kbrw/jsxz", { dir: 'webflow' }]
            ]
          }
        },
        exclude: /node_modules/,
      }
    ]
  }
}

var server_config = Object.assign(Object.assign({}, client_config), {
  target: "node",
  entry: "reaxt/react_server",
  output: {
    path: path.join(__dirname, '../priv/react_servers'), //typical output on the default directory served by Plug.Static
    filename: 'server.js', //dynamic name for long term caching, or code splitting, use WebPack.file_of(:main) to get it
    chunkFilename: 'chunk/server.[id].js'
  },
})

// optimisation : ONLY EMIT files for client compilation, all file-loader should not emit files on server compilation 
server_config.module = {
  rules: server_config.module.rules.map(rule => {
    return {
      ...rule,
      use: ((Array.isArray(rule.use)) ? rule.use : [rule.use]).map(use => {
        return { ...use, options: (use.loader === "file-loader") ? { ...use.options, emitFile: false } : use.options }
      })
    }
  })
}

// css management : MiniCssExtractPlugin on client build but ignore on serverside
client_config.module.rules.push(
  { test: /\.(css)$/, use: [{ loader: MiniCssExtractPlugin.loader }, { loader: "css-loader" }] })
server_config.module.rules.push(
  { test: /\.(css)$/, use: [{ loader: "null-loader" }] })

module.exports = [client_config, server_config]
