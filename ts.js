const glob = require("fast-glob");
const { default: PromiseQueue } = require("p-queue");
const os = require("os");
const path = require("path");
const { fork } = require("child_process");

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

  console.log(`total number of src files: ${tsFiles.length}`);

  const chunkSize = 1000;
  let chunkIndex = 0;
  const chunks = [];

  for (var i = 0; i < tsFiles.length; i++) {
    if (chunks[chunkIndex] && chunks[chunkIndex].length > chunkSize) {
      chunkIndex++;
    }

    chunks[chunkIndex] = chunks[chunkIndex] || [];
    chunks[chunkIndex].push(tsFiles[i]);
  }
  queue.addAll(
    chunks.map((chunk) => {
      return () => {
        createWorker(chunk);
      };
    })
  );

  queue.start();
};

function createWorker(f) {
  const cp = fork(path.join(__dirname, "tsworker.js"), { cwd: process.cwd() });
  cp.send(f);
  cp.on("message", (msg) => {
    cp.kill();
  });

  return cp;
}
