import * as vscode from "vscode";

import { IRawRelation, RelationServer } from "relation2-core";
import { IRelation, IRelationContainer } from "..";

export const deleteRelationCommandId = "_vscode-relation._deleteRelation";

export default async (
  relation: IRelationContainer | IRelation,
  relations?: IRelationContainer[] | IRelation[]
) => {
  if (!relation.workspaceFolderUri?.path) {
    return;
  }

  const relationServer = new RelationServer(relation.workspaceFolderUri?.path);
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

    relationServer.write(
      relationServer.filter((currentRelation: IRawRelation) => {
        if ((relation as IRelationContainer).children) {
          return currentRelation.fromPath !== relation.fromPath;
        } else {
          return currentRelation.id !== (relation as IRelation).id;
        }
      })
    );

    return true;
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

  relationServer.write(
    relationServer.filter((currentRelation: IRawRelation) => {
      return !relations!.some((relation) => {
        if ((relation as IRelationContainer).children) {
          return currentRelation.fromPath === relation.fromPath;
        } else {
          return currentRelation.id === (relation as IRelation).id;
        }
      });
    })
  );

  return true;
};
