import * as vscode from "vscode";
import setRelationFormData from "../core/setRelationFormData";

export const createRelationFromCommandId =
  "_vscode-relation._createRelationFrom";

export default async (uri: vscode.Uri) => {
  const path = uri.path;

  if (!path) {
    throw new Error("Failed to create relation from uri: can't find path");
  }

  setRelationFormData({
    type: "from",
    path,
  });
};
