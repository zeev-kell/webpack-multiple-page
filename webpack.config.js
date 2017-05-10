const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
function resolve(dir) {
    return path.join(__dirname, dir);
}

function assetsPath(_path) {
    return path.posix.join("static", _path);// 修改导出文件的路径
}

const glob = require('glob');
const srcDir = resolve('src');
let entryFiles = glob.sync(srcDir + '/js/*.js');// 获取src/js目录下的所有js文件
let entries = {};// 记录文件和文件路径
entryFiles.forEach((filePath) => {
    let filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'));
    entries[filename] = filePath;
});

const HtmlWebpackPlugin = require('html-webpack-plugin');
let entryHtml = glob.sync(srcDir + '/*.html');// 获取src目录下的所有html文件
let pluginHtml = [];
entryHtml.forEach((filePath) => {
    let filename = filePath.substring(filePath.lastIndexOf('\/') + 1, filePath.lastIndexOf('.'));
    let conf = {
        template: filePath,
        filename: filename + '.html'
    }
    if (filename in entries) {
        conf.inject = true;
        conf.chunks = ['manifest', 'vendor', filename];// NEW: 把打包出来的其他文件也引进来
    }
    pluginHtml.push(new HtmlWebpackPlugin(conf));
});

let plugins = [];
plugins.push(
    new ExtractTextPlugin({
        filename: assetsPath('css/[name].css')
    })
)
plugins = plugins.concat(pluginHtml);
plugins.push(
    new webpack.optimize.CommonsChunkPlugin({
        name     : 'vendor', // 提取node_modules的第三方包
        minChunks: function (module, count) {
            return (
                module.resource &&
                /\.js$/.test(module.resource) &&
                module.resource.indexOf(path.join(__dirname, './node_modules')) === 0
            )
        }
    }),
    new webpack.optimize.CommonsChunkPlugin({
        name  : 'manifest',// 提取webpack的公用代码
        chunks: ['vendor']
    }),
    new CopyWebpackPlugin([
        {
            from  : resolve('static'),// 复制根目录下的static文件
            to    : 'static',// 导出到相对文件的dist/static目录
            ignore: ['.*']
        }
    ])
)

module.exports = {
    entry  : entries,
    output : {
        path      : resolve('dist'),
        filename  : assetsPath('js/[name].js'),
        publicPath: '/'
    },
    resolve: {
        extensions: ['.js', '.json', '.scss', '.less'],
        alias     : {
            '@': resolve('src'),
        }
    },
    module : {
        rules: [
            {
                test   : /\.js$/,
                loader : 'babel-loader',
                include: [resolve('src')]
            }, {
                test  : /\.(png|jpe?g|gif|svg)(\?.*)?$/,
                loader: 'url-loader',
                query : {
                    limit: 10000,
                    name : assetsPath('img/[name].[ext]')
                }
            }, {
                test: /\.scss$/,
                use : ExtractTextPlugin.extract({
                    use: [{
                        loader: 'css-loader'
                    }, {
                        loader: 'postcss-loader'
                        // 对样式进行前缀处理， 需要 postcssrc.js 配置文件
                        // 并且需要在package.json里面增加配置
                    }, {
                        loader: 'sass-loader'
                    }]
                })
            }
        ]
    },
    plugins: plugins
};
