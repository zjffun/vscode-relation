import * as path from "path";
import * as vscode from "vscode";
import { IRelationContainer } from "..";
import { RelationService } from "../RelationService";
import { showRelationCommandId } from "./showRelation";

interface ISnippetQuickPickItem extends vscode.QuickPickItem {
  relation: IRelationContainer;
}

export const searchCommandId = "vscode-relation.search";

export default async () => {
  let relations: IRelationContainer[] = await RelationService.getList();

  const quickPickItems: ISnippetQuickPickItem[] = [];

  for (const relation of relations) {
    quickPickItems.push({
      label: `${path.join(relation.fromPath)} -> ${path.join(relation.toPath)}`,
      description: "",
      detail: "",
      relation: relation,
    });
  }

  const result = await vscode.window.showQuickPick(quickPickItems, {
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (result) {
    vscode.commands.executeCommand(showRelationCommandId, result.relation);
  }
};
