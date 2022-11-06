import * as _ from "lodash";
import { RelationServer } from "relation2-core";
import * as vscode from "vscode";
import { IRelationContainer, IRelationWorkspace } from ".";
import { log } from "./extension";
import { rangeToString } from "./util";

export class RelationService {
  constructor() {}

  static async getTree() {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const tree: IRelationWorkspace[] = [];

    if (workspaceFolders) {
      for (const folder of workspaceFolders) {
        const relationJSONUri = vscode.Uri.joinPath(
          folder.uri,
          ".relation",
          "relation.json"
        );

        let relationContainers: IRelationContainer[] = [];
        try {
          const relationServer = new RelationServer(folder.uri.path);
          const relations = await relationServer.read();

          const relationsGroupByFromPath = _.groupBy(relations, "fromPath");

          relationContainers = Object.entries(relationsGroupByFromPath).map(
            ([fromPath, children]) => {
              // @ts-ignore
              const dirty = children.some((child) => child.dirty);

              return {
                name: `${dirty ? "*" : ""}${fromPath}`,
                uri: relationJSONUri,
                workspaceFolderUri: folder.uri,
                fromPath,
                toPath: children[0]?.toPath,
                dirty,
                children: children.map((child) => {
                  return {
                    ...child,
                    // @ts-ignore
                    name: `${child.dirty ? "*" : ""}${rangeToString(
                      child.fromRange
                    )}`,
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

  static async getList() {
    const tree = await RelationService.getTree();

    const containers = [];

    for (const workspace of tree) {
      containers.push(...workspace.children);
    }

    return containers;
  }
}
