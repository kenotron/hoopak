const { readFile, writeFile, mkdir, truncate } = require("fs");
const { promisify } = require("util");
const path = require("path");
const ts = require("typescript");

const readFileAsync = promisify(readFile);
const writeFileAsync = promisify(writeFile);
const mkdirAsync = promisify(mkdir);

process.on("message", transpile);

async function transpile(chunk) {
  const cwd = process.cwd();
  for (const f of chunk) {
    try {
      const src = await readFileAsync(path.join(cwd, f), "utf-8");
      const ext = path.extname(f);

      if (f.endsWith(".ts") || f.endsWith(".tsx")) {
        const results = ts.transpileModule(src, {
          target: ts.ScriptTarget.ES2019,
          module: ts.ModuleKind.ES2015,
        });

        const outputFile = path.join(
          cwd,
          "ts-transpiled",
          f.replace(ext, ".js")
        );

        const outputPath = path.dirname(outputFile);

        await mkdirAsync(outputPath, { recursive: true });

        await writeFileAsync(outputFile, results.outputText);
      }
    } catch (e) {
      console.error(`Compilation for ${f} has failed:`);
      console.error(e + "\n\n");
    }
  }

  console.log(`done compiling ${chunk.length} files`);

  process.send("done");
}
