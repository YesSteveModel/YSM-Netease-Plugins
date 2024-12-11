import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import image from "@rollup/plugin-image";
import vue from "rollup-plugin-vue";
import {string} from "rollup-plugin-string";

export default {
    input: "src/index.js",
    output: {
        file: "ysm-netease-utils.js",
        format: "cjs"
    },
    plugins: [
        vue(),
        json(),
        resolve(),
        commonjs(),
        terser({
            mangle: false
        }),
        image(),
        string({
            include: "**/*.py"
        })
    ],
    external: ["path"]
};