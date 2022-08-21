import * as vscode from "vscode";

import { filterRelation, IRawRelation } from "relation2-core";
import { IRelation, IRelationContainer } from "..";

export const deleteRelationCommandId = "_vscode-relation._deleteRelation";

export default async (
  relation: IRelationContainer | IRelation,
  relations?: IRelationContainer[] | IRelation[]
) => {
  const multiple = relations?.some?.((r) => r === relation);

  if (!multiple) {
    const answer = await vscode.window.showWarningMessage(
      `Do you want to delete relation?`,
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
        if ((relation as IRelationContainer).children) {
          return currentRelation.fromPath !== relation.fromPath;
        } else {
          return currentRelation.id !== (relation as IRelation).id;
        }
      },
      {
        cwd: relation.workspaceFolderUri?.path,
      }
    );
  }

  const answer = await vscode.window.showWarningMessage(
    `Do you want to delete selected relations?`,
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
      return !relations!.some((relation) => {
        if ((relation as IRelationContainer).children) {
          return currentRelation.fromPath === relation.fromPath;
        } else {
          return currentRelation.id === (relation as IRelation).id;
        }
      });
    },
    {
      cwd: relation.workspaceFolderUri?.path,
    }
  );

  return true;
};
