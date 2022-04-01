// const path = require("path");

// process.env.ESBUILD_BINARY_PATH = path.join(
//   path.dirname(process.execPath),
//   "esbuild.exe"
// );

const yargsParser = require("yargs-parser");

const esbuild = require("./esbuild");
const swc = require("./swc");
const ts = require("./ts");
const validate = require("./validate");

const args = yargsParser(process.argv.slice(2));

const command = args._[0];

switch (command) {
  case "esbuild":
    // do esbuild transpilation
    esbuild({ cwd: process.cwd() });
    break;

  case "swc":
    // do esbuild transpilation
    swc({ cwd: process.cwd() });
    break;

  case "ts":
    ts({ cwd: process.cwd() });
    break;

  case "validate":
    // lint, typecheck
    validate({ cwd: process.cwd() });
    break;

  case "test":
    // jest?
    break;

  case "bundle":
    // esbuild
    break;
}
