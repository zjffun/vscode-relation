import * as vscode from "vscode";

import { IRawRelation } from "relation2-core";

interface IRelationBase {
  name: string;
  workspaceFolderUri?: vscode.Uri;
}
export interface IRelation extends IRawRelation, IRelationBase {}

export interface IRelationContainer extends IRelationBase {
  uri?: vscode.Uri;
  fromPath?: string;
  isWorkspace?: boolean;
  children: IRelationContainer[] | IRelation[];
}
