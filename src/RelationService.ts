import * as _ from "lodash";
import * as vscode from "vscode";
import { IRelation, IRelationContainer } from ".";
import { log } from "./extension";
import { rangeToString } from "./util";
import { refresh } from "./views/RelationExplorerView";

export class RelationService {
  private textDocument: vscode.TextDocument;

  constructor(textDocument: vscode.TextDocument) {
    this.textDocument = textDocument;
  }

  getList(): IRelation[] {
    let result: any = [];

    try {
      result = JSON.parse(this.textDocument.getText());
    } catch (error: any) {
      log.appendLine(error?.message);
    }

    return result;
  }

  static async getRelationsByUri(uri: vscode.Uri) {
    let textDoc = await vscode.workspace.openTextDocument(uri);

    const relationService = new RelationService(textDoc);

    let relations: IRelation[] = [];
    try {
      relations = await relationService.getList();
    } catch (error: any) {
      log.appendLine(error?.message);
    }

    return relations;
  }

  static async getTree() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const tree: IRelationContainer[] = [];

    if (workspaceFolders) {
      for (const folder of workspaceFolders) {
        const relationJSONUri = vscode.Uri.joinPath(
          folder.uri,
          ".relation",
          "relation.json"
        );

        let relationContainers: IRelationContainer[] = [];
        try {
          const relations = await RelationService.getRelationsByUri(
            relationJSONUri
          );

          const relationsGroupByFromPath = _.groupBy(relations, "fromPath");

          relationContainers = Object.entries(relationsGroupByFromPath).map(
            ([fromPath, children]) => {
              return {
                name: fromPath,
                uri: relationJSONUri,
                workspaceFolderUri: folder.uri,
                fromPath,
                children: children.map((child) => {
                  return {
                    ...child,
                    name: rangeToString(child.fromRange),
                    workspaceFolderUri: folder.uri,
                  };
                }),
              };
            }
          );
        } catch (error: any) {
          log.appendLine(error?.message);
          continue;
        }

        tree.push({
          name: folder.name,
          uri: relationJSONUri,
          workspaceFolderUri: folder.uri,
          children: relationContainers,
          isWorkspace: true,
        });
      }
    }

    return tree;
  }
}
