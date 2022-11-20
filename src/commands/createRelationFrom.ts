import * as vscode from "vscode";
import { CreateRelationsWebview } from "../views/CreateRelationsWebview";

export const createRelationFromCommandId =
  "_vscode-relation._createRelationFrom";

export default async (uri: vscode.Uri) => {
  const createRelationsWebview = CreateRelationsWebview.singleton();

  createRelationsWebview.fromUri = uri;

  createRelationsWebview.reveal();
  createRelationsWebview.setFromContent("");
};
