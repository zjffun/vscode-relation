import * as vscode from "vscode";
import { IRawRelation } from "relation2";

export interface IRelation extends IRawRelation {
  workspaceFolderUri?: vscode.Uri;
}

export interface IRelationContainer {
  name: string;
  uri?: vscode.Uri;
  children: IRelationContainer[] | IRelation[];
}
