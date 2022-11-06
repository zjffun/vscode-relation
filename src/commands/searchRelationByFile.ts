import * as vscode from "vscode";
import * as path from "path";
import { IRelationContainer } from "..";
import { RelationService } from "../RelationService";
import { showRelationCommandId } from "./showRelation";

interface ISnippetQuickPickItem extends vscode.QuickPickItem {
  relation: IRelationContainer;
}

export const searchRelationByFileCommandId =
  "_vscode-relation._searchRelationByFile";

export default async (uri: vscode.Uri) => {
  const filePath = uri.path;

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
  const workspaceFolderPath = workspaceFolder?.uri.path;

  if (!workspaceFolderPath) {
    return;
  }

  let relations: IRelationContainer[] = await RelationService.getList();

  const quickPickItems: ISnippetQuickPickItem[] = [];

  for (const relation of relations) {
    if (
      filePath === path.join(workspaceFolderPath, relation.fromPath) ||
      filePath === path.join(workspaceFolderPath, relation.toPath)
    ) {
      quickPickItems.push({
        label: `${relation.fromPath} -> ${relation.toPath}`,
        description: "",
        detail: "",
        relation: relation,
      });
    }
  }

  const result = await vscode.window.showQuickPick(quickPickItems, {
    matchOnDescription: true,
    matchOnDetail: true,
  });

  if (result) {
    vscode.commands.executeCommand(showRelationCommandId, result.relation);
  }
};
