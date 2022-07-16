import * as path from "node:path";
import * as vscode from "vscode";

let destPath: string | null = null;

export default async (uri: vscode.Uri) => {
  const { getInfo, createRelation } = await new Function(
    `return new Promise((res) => res(import("relation2")))`
  )();

  const workspace = vscode.workspace.getWorkspaceFolder(uri);

  if (!workspace) {
    return false;
  }

  const _path = uri.path;

  if (!_path) {
    return false;
  }

  const workspaceUri = workspace.uri;
  const cwd = workspaceUri.path;

  if (!destPath) {
    destPath = path.relative(cwd, _path);
    return;
  }

  const { srcCwd } = getInfo({ cwd });

  const srcPath = path.relative(srcCwd, _path);

  const result = await vscode.window.showInformationMessage(
    `Create relation ${srcPath} -> ${destPath}`,
    {
      modal: true,
    },
    "Yes",
    "No"
  );

  if (result === "Yes") {
    await createRelation({
      cwd,
      rev: "HEAD",
      srcRev: "HEAD",
      srcPath,
      path: destPath,
    });

    destPath = null;
    return true;
  }

  destPath = null;
  return true;
};
