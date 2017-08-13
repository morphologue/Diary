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
        filename: './wwwroot/[Name].js'
    },
    devtool: 'source-map',
    resolve: {
        extensions: ['.js', '.ts', '.tsx']
    },
    module: {
        rules: [
            {
                test: /\.(ttf|eot|woff|woff2|svg|gif)$/,
                loader: 'file-loader',
                options: {
                    name: 'binary/[name].[ext]'
                }
            },
            {
                test: /\.css$/,
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
            output: {
                sourceMap: true
            }
        })
    ] : [])
};
