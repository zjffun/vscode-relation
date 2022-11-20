import * as vscode from "vscode";

import { RelationServer } from "relation2-core";
import { rangeToString } from "../util";

export default async ({
  fromAbsolutePath,
  toAbsolutePath,
  fromRange,
  toRange,
}: {
  fromAbsolutePath: string;
  toAbsolutePath: string;
  fromRange: [number, number];
  toRange: [number, number];
}) => {
  const uri = vscode.Uri.parse(fromAbsolutePath);

  const workspace = vscode.workspace.getWorkspaceFolder(uri);

  if (!workspace) {
    return false;
  }

  const workspaceUri = workspace.uri;
  const cwd = workspaceUri.path;

  const result = await vscode.window.showInformationMessage(
    `Create relation ${fromAbsolutePath}:${rangeToString(
      fromRange
    )} -> ${toAbsolutePath}:${rangeToString(toRange)}`,
    {
      modal: true,
    },
    "Yes",
    "No"
  );

  if (result === "Yes") {
    const relationServer = new RelationServer(cwd);

    relationServer.write([
      ...relationServer.read(),
      await relationServer.create({
        fromAbsolutePath,
        toAbsolutePath,
        fromRange,
        toRange,
      }),
    ]);

    return true;
  }

  return true;
};
