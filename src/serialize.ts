import * as jsyaml from "js-yaml";

export function generateSecretYaml(secretName: string, entries: Map<string, string>): string {
  const encodedEntries: { [key: string]: string } = {};
  for (const [k, v] of entries) {
    encodedEntries[k] = Buffer.from(v, "utf8").toString("base64");
  }

  return jsyaml.safeDump({
    apiVersion: "v1",
    kind: "Secret",
    type: "Opaque",
    metadata: {
      name: secretName,
    },
    data: encodedEntries,
  });
}
