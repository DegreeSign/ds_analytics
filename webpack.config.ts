import webpack, { Configuration } from 'webpack';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import TerserPlugin from 'terser-webpack-plugin';
import path from 'path';

// Common configuration
const commonConfig: Configuration = {
    entry: `./src/index.ts`, // Entry point for your library
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
        new BundleAnalyzerPlugin(),
        new CleanWebpackPlugin(), // Clean output directory before each build
        new webpack.BannerPlugin({
            banner: `/*! MIT License. DegreeSign Analytics. https://opensource.org/licenses/MIT */`,
            raw: true, // Ensures the comment appears as-is without being wrapped
        }),
    ],
    optimization: {
        minimize: true,           // Minify the output
        minimizer: [new TerserPlugin()],
        usedExports: true,        // Enable tree-shaking
        sideEffects: false,       // Mark the project as free of side effects
    },
    mode: `production`,          // Ensure output is optimized
};

module.exports = [{
    // Browser configuration
    ...commonConfig,
    target: `web`,
    output: {
        path: path.resolve(__dirname, `dist/browser`), // Separate output directory
        filename: `degreesign.min.js`,
        library: `dsAnalytics`, // Global variable for browsers
        libraryTarget: `umd`, // UMD for browser
        globalObject: `this`,
    },
}, {
    // Node.js configuration
    ...commonConfig,
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
}];