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
    const fromTempPath = path.join(relation.fromBaseDir, relation.fromPath);
    const toTempPath = path.join(relation.toBaseDir, relation.toPath);

    if (
      filePath === path.join(workspaceFolderPath, fromTempPath) ||
      filePath === path.join(workspaceFolderPath, toTempPath)
    ) {
      quickPickItems.push({
        label: `${fromTempPath} -> ${toTempPath}`,
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
