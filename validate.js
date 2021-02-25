const glob = require("fast-glob");
const ts = require("typescript");
const path = require("path");
const fs = require("fs");

module.exports = async function validate(options) {
  const { cwd } = options;
  const tsconfigFiles = await glob("**/tsconfig.json", {
    cwd,
    ignore: ["**/node_modules"],
  });

  const tsconfigFile = tsconfigFiles[1];

  const compilerHost = ts.createCompilerHost({
    noEmit: true,
  });

  const config = ts.readConfigFile(path.join(process.cwd(), tsconfigFile), (f) => fs.readFileSync(f, 'utf-8'));

  const commandLine = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    path.join(process.cwd(), path.dirname(tsconfigFile))
  );

  const createProgram = ts.createProgram;

  // affix the cwd to the project root
  compilerHost.getCurrentDirectory = () => path.join(process.cwd(), path.dirname(tsconfigFile));

  const program = createProgram({
    host: compilerHost,
    options: commandLine.options,
    rootNames: commandLine.fileNames
  });

  const emitResult = program.emit();

  let allDiagnostics = ts
    .getPreEmitDiagnostics(program)
    .concat(emitResult.diagnostics);

  allDiagnostics.forEach((diagnostic) => {
    if (diagnostic.file) {
      let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start
      );
      let message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n"
      );
      console.log(
        `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
      );
    } else {
      console.log(
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
      );
    }
  });
};
