
import path from 'path';

import webpack from 'webpack';

export default {
    entry: {
        app: path.resolve('src/index.js'),
    },
    resolve: {
        alias: {
            '@': path.resolve('src/'),
        },
    },
    module: {
        rules: [
            {
                test: /\.(mp3|svg)$/,
                type: 'asset/resource',
            },
        ],
    },
    plugins: [
        new webpack.DefinePlugin({
            // https://github.com/vuejs/core/tree/main/packages/vue#bundler-build-feature-flags
            __VUE_OPTIONS_API__: true,
            __VUE_PROD_DEVTOOLS__: false,
        }),
    ],
};
