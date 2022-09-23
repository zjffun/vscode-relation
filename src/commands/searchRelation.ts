import * as vscode from "vscode";
import { IRelation, IRelationContainer } from "..";
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
      label: `${relation.fromPath} -> ${relation.toPath}`,
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
