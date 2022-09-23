import * as vscode from "vscode";

import { IRawRelation, IRawRelationCommon } from "relation2-core";

interface IRelationBase {
  name: string;
  workspaceFolderUri?: vscode.Uri;
}
export interface IRelation extends IRawRelation, IRelationBase {}

export interface IRelationWorkspace extends IRelationBase {
  uri?: vscode.Uri;
  isWorkspace?: boolean;
  children: IRelationContainer[];
}

export interface IRelationContainer extends IRawRelationCommon, IRelationBase {
  uri?: vscode.Uri;
  isWorkspace?: boolean;
  children: IRelationContainer[] | IRelation[];
}
