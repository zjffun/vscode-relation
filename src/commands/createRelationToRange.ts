import * as vscode from "vscode";
import setRelationFormData from "../core/setRelationFormData";

export const createRelationToRangeCommandId =
  "_vscode-relation._createRelationToRange";

// TODO: update
export default async () => {
  const { activeTextEditor } = vscode.window;

  const path = activeTextEditor?.document?.uri?.path;

  if (!path) {
    throw new Error(
      "Failed to create relation to range: can't find path from activeTextEditor"
    );
  }

  setRelationFormData({
    type: "to",
    path,
    startLine: activeTextEditor?.selection?.start?.line + 1,
    endLine: activeTextEditor?.selection?.end?.line + 1,
  });
};
