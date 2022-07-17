import * as path from "node:path";
import * as vscode from "vscode";

export default async ({
  formPath,
  toPath,
}: {
  formPath: string;
  toPath: string;
}) => {
  const { getInfo, createRelation } = await new Function(
    `return new Promise((res) => res(import("relation2")))`
  )();

  const uri = vscode.Uri.parse(toPath);

  const workspace = vscode.workspace.getWorkspaceFolder(uri);

  if (!workspace) {
    return false;
  }

  const workspaceUri = workspace.uri;
  const cwd = workspaceUri.path;

  const toRelativePath = path.relative(cwd, toPath);

  const { srcCwd } = getInfo({ cwd });

  const fromRelativePath = path.relative(srcCwd, formPath);

  const result = await vscode.window.showInformationMessage(
    `Create relation ${fromRelativePath} -> ${toRelativePath}`,
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
      srcPath: fromRelativePath,
      path: toRelativePath,
    });

    return true;
  }

  return true;
};
