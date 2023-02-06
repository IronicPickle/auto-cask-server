const path = require("path");

module.exports = {
  target: "node",
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "build"),
    clean: true,
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      "@config": path.resolve(__dirname, "./src/config/"),
      "@api": path.resolve(__dirname, "./src/api/"),

      "@lib": path.resolve(__dirname, "./src/lib/"),
      "@utils": path.resolve(__dirname, "./src/lib/utils/"),
      "@ts": path.resolve(__dirname, "./src/lib/ts/"),
      "@enums": path.resolve(__dirname, "./src/lib/enums/"),
      "@constants": path.resolve(__dirname, "./src/lib/constants/"),

      "@express": path.resolve(__dirname, "./src/express/"),
      "@mongoose": path.resolve(__dirname, "./src/mongoose/"),

      "@src": path.resolve(__dirname, "./src/"),

      "@shared": path.resolve(__dirname, "../auto-cask-shared/"),
    },
  },
  node: {
    global: true,
    __filename: true,
    __dirname: true,
  },
  watchOptions: {
    ignored: ["/node_modules", "/build"],
  },
};
