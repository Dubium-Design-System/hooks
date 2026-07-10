import { browserRuntime, nodeRuntime, reactRecommended } from "@dubium/eslint-config"
import eslintConfigPrettier from "eslint-config-prettier"
import eslintPluginPrettier from "eslint-plugin-prettier"
import { defineConfig } from "eslint/config"

export default defineConfig([
	...reactRecommended,
	...browserRuntime,
	...nodeRuntime,
	{
		plugins: {
			prettier: eslintPluginPrettier,
		},
		rules: {
			"prettier/prettier": "error",
		},
	},
	{
		files: ["eslint.config.{js,mjs,ts,mts}", "vite.config.{js,mjs,ts,mts}"],
		rules: {
			"no-restricted-exports": "off",
		},
	},
	eslintConfigPrettier,
])
