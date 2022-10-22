import * as vscode from "vscode";
import { CreateRelationsWebview } from "../views/CreateRelationsWebview";

export const createRelationToCommandId = "_vscode-relation._createRelationTo";

export default async (uri: vscode.Uri) => {
  const createRelationsWebview = CreateRelationsWebview.singleton();

  createRelationsWebview.toUri = uri;

  createRelationsWebview.reveal();
  createRelationsWebview.setToContent("HEAD");
};
