import * as child_process from "child_process";

export function kubectlApply(context: string, yaml: string) {
  return new Promise((resolve, reject) => {
    const process = child_process.exec("kubectl apply -f -", (err, stdout, stderr) => {
      if (err) {
        reject(err);
        return;
      }
      console.log(`stdout=${stdout}`);
      console.log(`stderr=${stderr}`);
      resolve();
    });
    process.stdin.write(yaml);
  });
}
