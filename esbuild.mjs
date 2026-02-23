import * as esbuild from "esbuild";

const isProduction = process.argv.includes("--production");
const isWatch = process.argv.includes("--watch");

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/extension.js",
  external: ["vscode"],
  format: "cjs",
  platform: "node",
  target: "node18",
  sourcemap: !isProduction,
  minify: isProduction,
  treeShaking: true,
};

async function main() {
  if (isWatch) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log("[esbuild] 监听文件变更中...");
  } else {
    await esbuild.build(buildOptions);
    console.log(
      `[esbuild] 构建完成 (${isProduction ? "production" : "development"})`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
