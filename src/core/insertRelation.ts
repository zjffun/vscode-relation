import * as vscode from "vscode";

import { insertRelation } from "relation2-core";
import { rangeToString } from "../util";

export default async ({
  fromPath,
  toPath,
  fromRev,
  toRev,
  fromRange,
  toRange,
}: {
  fromPath: string;
  toPath: string;
  fromRev?: string;
  toRev?: string;
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

  if (result === "Yes") {
    await insertRelation({
      cwd,
      fromPath: fromPath,
      toPath: toPath,
      fromRev: !fromRev ? "HEAD" : fromRev,
      toRev: !toRev ? "HEAD" : toRev,
      fromRange,
      toRange,
    });

    return true;
  }

  return true;
};
