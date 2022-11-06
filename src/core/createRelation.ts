import * as vscode from "vscode";

import { RelationServer } from "relation2-core";
import { rangeToString } from "../util";

export default async ({
  fromPath,
  toPath,
  fromRange,
  toRange,
}: {
  fromPath: string;
  toPath: string;
  fromRange: [number, number];
  toRange: [number, number];
}) => {
  const uri = vscode.Uri.parse(toPath);

  const workspace = vscode.workspace.getWorkspaceFolder(uri);

  if (!workspace) {
    return false;
  }

  const workspaceUri = workspace.uri;
  const cwd = workspaceUri.path;

  const result = await vscode.window.showInformationMessage(
    `Create relation ${fromPath}:${rangeToString(
      fromRange
    )} -> ${toPath}:${rangeToString(toRange)}`,
    {
      modal: true,
    },
    "Yes",
    "No"
  );

  // TODO: content or git mode
  if (result === "Yes") {
    const relationServer = new RelationServer(cwd);

    relationServer.write([
      ...relationServer.read(),
      await relationServer.create({
        fromPath: fromPath,
        toPath: toPath,
        fromRange,
        toRange,
        // fromGitRev: !fromRev ? "HEAD" : fromRev,
        // toGitRev: !toRev ? "HEAD" : toRev,
      }),
    ]);

    return true;
  }

  return true;
};
