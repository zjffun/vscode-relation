import * as vscode from "vscode";

import { createRelation } from "relation2";

export default async ({
  fromPath,
  toPath,
  fromRev,
  toRev,
}: {
  fromPath: string;
  toPath: string;
  fromRev?: string;
  toRev?: string;
}) => {
  const uri = vscode.Uri.parse(toPath);

  const workspace = vscode.workspace.getWorkspaceFolder(uri);

  if (!workspace) {
    return false;
  }

  const workspaceUri = workspace.uri;
  const cwd = workspaceUri.path;

  const result = await vscode.window.showInformationMessage(
    `Create relation ${fromPath} -> ${toPath}`,
    {
      modal: true,
    },
    "Yes",
    "No"
  );

  if (result === "Yes") {
    await createRelation({
      cwd,
      fromPath: fromPath,
      toPath: toPath,
      fromRev: !fromRev ? "HEAD" : fromRev,
      toRev: !toRev ? "HEAD" : toRev,
    });

    return true;
  }

  return true;
};
