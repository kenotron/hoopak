const { transform } = require("esbuild");
const glob = require("fast-glob");
const { default: PromiseQueue } = require("p-queue");
const { readFile, writeFile, mkdir } = require("fs");
const { promisify } = require("util");
const os = require("os");
const path = require("path");

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);
const mkdirAsync = promisify(mkdir);

const maxWorkers = os.cpus().length - 1;

module.exports = async function (options) {
  console.log(`building with ${maxWorkers} workers`);

  const queue = new PromiseQueue({ concurrency: maxWorkers });
  const { cwd } = options;
  const tsFiles = await glob(
    [
      "**/*.ts",
      "**/*.tsx",
      "!**/*.d.ts",
      "!esbuild-transpiled/**",
      "!ts-transpiled/**",
    ],
    {
      ignore: ["**/node_modules"],
    }
  );

  console.log(`transpiling ${tsFiles.length} files`);

  queue.addAll(
    tsFiles.map((f) => {
      return async () => {
        try {
          const src = await readFileAsync(path.join(cwd, f), "utf-8");
          const ext = path.extname(f);

          if (f.endsWith(".ts") || f.endsWith(".tsx")) {
            const results = await transform(src, { loader: ext.slice(1) });
            const outputFile = path.join(
              cwd,
              "esbuild-transpiled",
              f.replace(ext, ".js")
            );

            const outputPath = path.dirname(outputFile);

            await mkdirAsync(outputPath, { recursive: true });

            await writeFileAsync(outputFile, results.code);
          }
        } catch (e) {
          console.error(`Compilation for ${f} has failed:`);
          console.error(e.message + "\n\n");
        }
      };
    })
  );

  queue.start();
};
