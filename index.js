const yargsParser = require("yargs-parser");

const build = require("./build");

const args = yargsParser(process.argv.slice(2));

const command = args._[0];

switch (command) {
  case "build":
    // do esbuild transpilation
    build({ cwd: process.cwd() });
    break;

  case "validate":
    // lint, typecheck
    break;

  case "test":
    // jest?
    break;

  case "bundle":
    // esbuild
    break;
}
