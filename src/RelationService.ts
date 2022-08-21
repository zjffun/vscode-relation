import * as _ from "lodash";
import * as vscode from "vscode";
import { IRelationContainer } from ".";
import { log } from "./extension";
import { rangeToString } from "./util";
import { getRawRelationWithDirty } from "relation2-core";

export class RelationService {
  constructor() {}

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
          const relations = await getRawRelationWithDirty({
            cwd: folder.uri.path,
          });

          const relationsGroupByFromPath = _.groupBy(relations, "fromPath");

          relationContainers = Object.entries(relationsGroupByFromPath).map(
            ([fromPath, children]) => {
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
}
