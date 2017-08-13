/// <binding ProjectOpened='Watch - Development' />
var Webpack = require('webpack');
var WebpackNotifier = require('webpack-notifier');

var PROD = process.env.NODE_ENV === 'production';

module.exports = {
    entry: {
        Site: ['./Scripts/Site.ts', './Scripts/Site.css'],
        Index: ['./Scripts/Home/Index.ts', './Scripts/Home/Index.css']
    },
    output: {
        path: __dirname + '/wwwroot',
        filename: '[Name].js'
    },
    devtool: 'source-map',
    resolve: {
        extensions: ['.js', '.ts', '.tsx']
    },
    module: {
        rules: [
            {
                test: /\.(ttf|eot|woff|woff2|svg|gif)$/,
                exclude: /tinymce\\skins\\/,
                loader: 'file-loader',
                options: {
                    name: 'binary/[name].[ext]'
                }
            },
            {
                test: /\.css$/,
                exclude: /tinymce\\skins\\/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.tsx?$/,
                loader: 'awesome-typescript-loader'
            },
            {
                // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
                enforce: 'pre',
                test: /\.js$/,
                loader: 'source-map-loader'
            }
        ]
    },
    plugins: [
        new WebpackNotifier()
    ].concat(PROD ? [
        new Webpack.optimize.UglifyJsPlugin({
            sourceMap: true,
            output: {
                ascii_only: true
            }
        })
    ] : [])
};
