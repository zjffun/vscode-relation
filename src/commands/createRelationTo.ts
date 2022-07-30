import * as vscode from "vscode";
import setRelationFormData from "../core/setRelationFormData";

export const createRelationToCommandId = "_vscode-relation._createRelationTo";

export default async (uri: vscode.Uri) => {
  const path = uri.path;

  if (!path) {
    throw new Error("Failed to create relation to uri: can't find path");
  }

  setRelationFormData({
    type: "to",
    path,
  });
};
