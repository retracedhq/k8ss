import * as commander from "commander";
import * as util from "util";

commander
  .version("0.1.0")
  .command("set <name> <entries...>")
  .action(handleSet);

commander
  .command("get <name> <entryName>")
  .action(handleGet);

commander.parse(process.argv);

function handleSet(name: string, entries: string[]) {
  const entryMap = new Map<string, string>();
  for (const e of entries) {
    const tokens = e.split("=");
    if (tokens.length < 2) {
      console.error(`Invalid entry: ${e}`);
      continue;
    }
    entryMap.set(tokens[0], tokens[1]);
  }
}

function handleGet(name: string, entryName: string) {
  console.log(`got name: ${name}`);
  console.log(`got entryName: ${entryName}`);
}
