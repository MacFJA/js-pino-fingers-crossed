import mixexport from "@mnrendra/rollup-plugin-mixexport";
import esbuild from "rollup-plugin-esbuild";

/** @type {import('rollup').RollupOptions} */
export default {
	external: ["pino"],
	input: "src/index.mjs",
	output: [
		{
			exports: "named",
			file: "src/index.cjs",
			format: "cjs",
			// sourcemap: true,
		},
	],
	plugins: [
		esbuild({
			// minify: true
		}),
		mixexport(),
	],
};
