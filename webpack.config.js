
import path from 'path';

import { VueLoaderPlugin } from 'vue-loader';
import webpack from 'webpack';

export default {
    entry: {
        app: path.resolve('src/index.js'),
    },
    resolve: {
        alias: {
            '@': path.resolve('src/'),
        },
        extensions: ['.js', '.vue'],
    },
    module: {
        rules: [
            {
                // https://github.com/webpack/webpack/issues/16660
                test: /\.js$/,
                resolve: {
                    fullySpecified: false,
                },
            },
            {
                test: /\.vue$/,
                loader: 'vue-loader',
            },
            {
                test: /\.(mp3|svg)$/,
                type: 'asset/resource',
            },
        ],
    },
    plugins: [
        new VueLoaderPlugin(),

        new webpack.DefinePlugin({
            // https://github.com/vuejs/core/tree/main/packages/vue#bundler-build-feature-flags
            __VUE_OPTIONS_API__: true,
            __VUE_PROD_DEVTOOLS__: false,
            __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
        }),
    ],
    performance: {
        hints: false,
    },
};
