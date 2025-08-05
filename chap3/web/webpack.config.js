module.exports = {
  entry: './script.js',
  mode: 'development',
  devtool: 'inline-source-map',
  output: { filename: 'bundle.js' },
  plugins: [],
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
            ],
            plugins: ['../babel-plugin']
          }
        },
        exclude: /node_modules/
      }
    ]
  },
}
