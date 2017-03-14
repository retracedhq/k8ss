import * as Kubernetes from "kubernetes-client";

export interface Secret {
  name: string;
  fields: Map<string, string>;
}

let sharedClient: any;
let contextOverride: string;

function k8sClient() {
  if (!sharedClient) {
    let maybeConfig;
    try {
      maybeConfig = Kubernetes.config.getInCluster();
    } catch (err) {
      try {
        maybeConfig = Kubernetes.config.fromKubeconfig(null, contextOverride);
      } catch (err) {
        console.error(err);
        throw new Error("Unable to obtain Kubernetes configuration data");
      }
    }

    sharedClient = new Kubernetes.Core(maybeConfig);
  }
  return sharedClient;
}

function mapToObject(mapIn: Map<string, any>): { [k: string]: any } {
  const result: { [k: string]: any } = {};
  for (const [k, v] of mapIn) {
    result[k] = v;
  }
  return result;
}

function createKubeSecret(secretIn: Secret): object {
  let fields: any = {};
  for (const [k, v] of secretIn.fields) {
    fields[k] = Buffer.from(v, "utf8").toString("base64");
  }

  return {
    apiVersion: "v1",
    kind: "Secret",
    type: "Opaque",
    metadata: {
      name: secretIn.name,
    },
    data: fields,
  };
}

function parseKubeSecret(objIn: any): Secret | undefined {
  if (!objIn.metadata || !objIn.data) {
    return undefined;
  }

  const fieldsIn: { [key: string]: string } = objIn.data;
  const fieldsOut = new Map<string, string>();
  for (const k in fieldsIn) {
    if (fieldsIn.hasOwnProperty(k)) {
      fieldsOut.set(k, Buffer.from(fieldsIn[k], "base64").toString("utf8"));
    }
  }

  return {
    name: objIn.metadata.name,
    fields: fieldsOut,
  };
}

export function setContextOverride(context: string) {
  sharedClient = null;
  contextOverride = context;
}

export function putSecret(secretIn: Secret) {
  return new Promise((resolve, reject) => {
    const body = createKubeSecret(secretIn);
    k8sClient().ns.secrets.put({ body }, (err: Error, resp: any) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
}

export function getSecret(name: string, fieldKey?: string): Promise<Secret | undefined> {
  return new Promise<Secret | undefined>((resolve, reject) => {
    // TODO: Server-side filtering of fields once k8s actually supports it.
    k8sClient().ns.secrets.get((err: Error, resp: any) => {
      if (err) {
        console.error(err);
        reject(err);
        return;
      }
      if (resp.kind !== "SecretList") {
        const err2 = new Error(`Unhandled response kind: '${resp.kind}'`);
        console.error(err2);
        reject(err2);
        return;
      }

      for (const item of resp.items) {
        if (item.metadata.name === name) {
          resolve(parseKubeSecret(item));
          return;
        }
      }

      resolve(undefined);
    });
  });
}
