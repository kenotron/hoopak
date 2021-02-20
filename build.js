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

console.log(`building with ${maxWorkers} workers`);

const queue = new PromiseQueue({ concurrency: maxWorkers });

module.exports = async function (options) {
  const { cwd } = options;
  const tsFiles = await glob(["**/*.ts", "**/*.tsx", "!**/*.d.ts"], {
    ignore: ["**/node_modules"],
  });

  queue.addAll(
    tsFiles.map((f) => {
      return async () => {
        try {
          const src = await readFileAsync(path.join(cwd, f), "utf-8");
          const ext = path.extname(f).slice(1);

          if (ext.startsWith("ts")) {
            const results = await transform(src, { loader: ext });
            const outputFile = path.join(
              cwd,
              "transpiled",
              f.replace(ext, "js")
            );
            const outputPath = path.dirname(outputFile);

            await mkdirAsync(outputPath, { recursive: true });

            await writeFileAsync(
              path.join(cwd, "transpiled", f.replace(ext, "js")),
              results.code
            );
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
