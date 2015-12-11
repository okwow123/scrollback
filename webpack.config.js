const path = require("path");
const config = require("./webpack-common.config");

module.exports = Object.assign({}, config, {
	entry: [
		"./ui/app"
	],
	output: {
		path: path.resolve(__dirname, "public/s/dist/scripts/"),
		publicPath: "/public/",
		filename: "app.bundle.min.js",
		sourceMapFilename: "app.bundle.min.js.map"
	}
});