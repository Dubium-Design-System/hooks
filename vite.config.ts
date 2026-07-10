import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { resolve } from "node:path"
import { visualizer } from "rollup-plugin-visualizer"

const external = ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"]

export default defineConfig({
	plugins: [
		react(),
		visualizer({
			title: "@dubium/hooks",
			filename: "stats.html",
			gzipSize: true,
			brotliSize: true,
		}),
	],
	build: {
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			formats: ["es"],
			fileName: () => "index.js",
		},
		emptyOutDir: true,
		rolldownOptions: {
			external,
			output: {
				preserveModules: true,
				preserveModulesRoot: "src",
				entryFileNames: "[name].js",
				chunkFileNames: "[name].js",
				assetFileNames: "[name][extname]",
			},
		},
	},
})
