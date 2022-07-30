import * as vscode from "vscode";

import { filterRelation, IRawRelation } from "relation2";
import { IRelation, IRelationContainer } from "..";

export const deleteRelationCommandId = "_vscode-relation._deleteRelation";

export default async (relation: IRelationContainer | IRelation) => {
  const answer = await vscode.window.showWarningMessage(
    `Do you want to delete relation of ${relation.fromPath}?`,
    {
      modal: true,
    },
    "Delete"
  );

  if (answer !== "Delete") {
    return;
  }

  filterRelation(
    (currentRelation: IRawRelation) => {
      return currentRelation.fromPath !== relation.fromPath;
    },
    {
      cwd: relation.workspaceFolderUri?.path,
    }
  );

  return true;
};
