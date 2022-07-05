import * as vscode from "vscode";
import { IRawRelation } from "relation2";

export interface IRelation extends IRawRelation {}

export interface IRelationContainer {
  name: string;
  uri?: vscode.Uri;
  workspaceFolderUri?: vscode.Uri;
  children: IRelationContainer[] | IRelation[];
}
