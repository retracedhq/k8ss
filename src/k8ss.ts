import * as commander from "commander";
import * as Table from "cli-table";

import { getSecret, putSecret } from "./kube";

commander
  .version("0.1.0")
  .description("Fields are specified as key=value pairs")
  .command("set <name> <fields...>")
  .action(handleSet);

commander
  .command("get <name> [fieldKey]")
  .action(handleGet);

commander.parse(process.argv);

async function handleSet(name: string, rawFields: string[]) {
  const fields = new Map<string, string>();
  for (const f of rawFields) {
    const tokens = f.split("=");
    if (tokens.length < 2) {
      console.error(`Invalid entry: ${f}`);
      continue;
    }
    fields.set(tokens[0], tokens[1]);
  }
  if (!fields.size) {
    console.error("No valid entries specified");
    return;
  }

  try {
    await putSecret({ name, fields });
  } catch (err) {
    process.exit(1);
    return;
  }
}

async function handleGet(name: string, fieldKey?: string) {
  let secret;
  try {
    secret = await getSecret(name, fieldKey);
  } catch (err) {
    process.exit(1);
    return;
  }

  if (!secret) {
    console.error(`Unknown secret: ${name}`);
    process.exit(1);
    return;
  }

  const table = new Table({
    head: ["Field Key", "Value"],
  });
  console.log(`Secret: ${name}`);
  console.log("Values:");
  for (const [k, v] of secret.fields) {
    table.push([k, v]);
  }
  console.log(table.toString());
}
