import * as program from "commander";
import * as fs from "promise-fs";
import * as readline from "readline";
import { log } from "./logger";
import { interpret } from "./interpreter";

const main = async () => {
  program.option("-f, --file <path>", "Program to run").parse(process.argv);

  const { file } = program;

  const fileStream = fs.createReadStream(file);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const code: string[] = [];

  for await (const line of rl) {
    code.push(line);
  }

  try {
    const output = await interpret(code, [], true);
    log(output);
  } catch (err) {
    log(`Interpretation failed with error ${err.message}`);
  }
};

main();
