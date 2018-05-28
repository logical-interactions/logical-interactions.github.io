module.exports = {
    entry: "./src/index.tsx",
    output: {
        filename: "bundle.js",
        path: __dirname + "/dist",
        publicPath: "/dist",
    },

    // Enable sourcemaps for debugging webpack's output.
    devtool: "source-map",

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
    },

    module: {
        rules: [
            // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
            {
                test: /\.tsx?$/,
                use: [
                    {loader: "awesome-typescript-loader" }
                ]
            },
            {
                test: /\.js$/,
                enforce: "pre",
                loader: "source-map-loader",
            },
            { 
                test: /\.tsx?$/,
                enforce: "pre",
                loader: 'tslint-loader'
            }
        ],
    },

    // When importing a module whose path matches one of the following, just
    // assume a corresponding global variable exists and use that instead.
    // This is important because it allows us to avoid bundling all of our
    // dependencies, which allows browsers to cache those libraries between builds.
    externals: {
        "sql.js": "SQL",
        "react": "React",
        "react-dom": "ReactDOM",
        "d3": "d3",
    },
    
    target: 'web',
    devServer: {
        inline: true
    },
};
