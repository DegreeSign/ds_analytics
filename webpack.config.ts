import path from 'path';
import webpack, { Configuration } from 'webpack';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'

// Common configuration
const commonConfig: Configuration = {
    resolve: {
        extensions: [`.ts`, `.js`], // Resolve .ts and .js files
    },
    module: {
        rules: [
            {
                test: /\.ts$/,         // Match .ts files
                use: `ts-loader`,      // Use ts-loader for TypeScript
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new webpack.BannerPlugin({
            banner: `MIT License. DegreeSign Analytics. https://opensource.org/licenses/MIT`,
        }),
    ],
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
            terserOptions: {
                format: {
                    comments: /@license/i,
                },
            },
            extractComments: false,
        })],
        usedExports: true,        // Enable tree-shaking
        sideEffects: false,       // Mark the project as free of side effects
    },
    mode: `production`,          // Ensure output is optimized
};

module.exports = [{
    // Browser configuration
    ...commonConfig,
    entry: `./src/browser.ts`, // Entry point for your library
    target: `web`,
    output: {
        path: path.resolve(__dirname, `dist/browser`), // Separate output directory
        filename: `degreesign.min.js`,
        library: `dsAnalytics`, // Global variable for browsers
        libraryTarget: `umd`, // UMD for browser
        globalObject: `this`,
    },
    plugins: [
        new CleanWebpackPlugin(), // Clean output directory before each build
        ...commonConfig.plugins || [],
    ],
}, {
    // Node.js configuration
    ...commonConfig,
    entry: `./src/index.ts`, // Entry point for your library
    target: `node18`,
    resolve: {
        ...commonConfig.resolve,
        mainFields: [`module`, `main`],
        conditionNames: [`import`, `default`],
        aliasFields: [],
        preferRelative: true,
    },
    output: {
        path: path.resolve(__dirname, `dist/node`), // Separate output directory
        filename: `degreesign.node.min.js`,
        libraryTarget: `commonjs`, // CommonJS for Node.js
        globalObject: `typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this)`,
    },
    node: {
        __dirname: false, // Prevent Webpack from mocking __dirname
        __filename: false, // Prevent Webpack from mocking __filename
    },
    plugins: [
        new BundleAnalyzerPlugin() as any,
        ...commonConfig.plugins || [],
    ],
}];