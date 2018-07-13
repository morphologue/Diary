/// <binding ProjectOpened='Watch - Development' />
var Webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        Site: ['./Scripts/Site.ts'],
        Index: ['./Scripts/Home/Index.ts']
    },
    output: {
        path: __dirname + '/wwwroot',
        filename: '[Name].js'
    },
    resolve: {
        extensions: ['.js', '.ts', '.tsx']
    },
    module: {
        rules: [
            {
                test: /\.(ttf|eot|woff|woff2|svg|gif|png)$/,
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
        new CopyWebpackPlugin([
            {
                from: 'node_modules/bootstrap/dist/css/bootstrap.min.css',
                to: 'skins'
            },
            {
                from: 'node_modules/tinymce/skins',
                to: 'skins'
            },
            {
                from: 'node_modules/tinymce/plugins',
                to: 'plugins'
            }
        ])
    ]
};
