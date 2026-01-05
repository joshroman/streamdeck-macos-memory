import resolve from "@rollup/plugin-node-resolve";
import typescript from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";

export default {
  input: "src/plugin.ts",
  output: {
    file: "com.joshroman.swapmonitor.sdPlugin/bin/plugin.js",
    format: "cjs",
    sourcemap: true
  },
  plugins: [
    resolve({
      extensions: [".ts", ".js"],
      preferBuiltins: true
    }),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: false
    })
  ],
  external: ["child_process", "util", "fs", "path", "os", "net", "http", "https", "stream", "events", "crypto", "buffer", "url", "assert", "tty", "zlib"]
};
