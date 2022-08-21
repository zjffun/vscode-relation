import * as vscode from "vscode";
import { IRelation, IRelationContainer } from "..";
import { RelationService } from "../RelationService";
import { log } from "../extension";
import { showRelationCommandId } from "../commands/showRelation";

let relationExplorerView: RelationExplorerView;

export default class RelationExplorerView
  implements vscode.TreeDataProvider<IRelation | IRelationContainer>
{
  public static viewId = "vscode-relation-relationsView-RelationExplorerView";

  protected context: vscode.ExtensionContext;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;

    vscode.window.createTreeView(RelationExplorerView.viewId, {
      treeDataProvider: this,
      showCollapseAll: true,
      canSelectMany: true,
    });

    relationExplorerView = this;
  }

  public refresh(): any {
    this._onDidChangeTreeData.fire(null);
  }

  public getTreeItem(element: IRelation | IRelationContainer): vscode.TreeItem {
    const { children: isContainer, isWorkspace } = <IRelationContainer>element;

    const showRelationCommand = {
      command: showRelationCommandId,
      title: "Show relation of this file.",
      arguments: [element],
    };

    let contextValue = "vscode-relation-relationExplorerView-file";

    if (isWorkspace) {
      contextValue = "vscode-relation-relationExplorerView-workspace";
    }

    if (isContainer) {
      return {
        label: element.name,
        collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
        contextValue,
      };
    }

    contextValue = "vscode-relation-relationExplorerView-range";

    return {
      label: element.name,
      command: showRelationCommand,
      collapsibleState: undefined,
      contextValue,
    };
  }

  public getChildren(
    element?: IRelation | IRelationContainer
  ):
    | IRelation[]
    | Thenable<IRelation[]>
    | IRelationContainer[]
    | Thenable<IRelationContainer[]> {
    return element ? this.getTreeElement(element) : this.getTree();
  }

  protected getTreeElement = (element: IRelation | IRelationContainer) => {
    const _element = <IRelationContainer>element;

    if (!_element?.children) {
      return [];
    }

    return _element.children;
  };

  protected _onDidChangeTreeData: vscode.EventEmitter<any> =
    new vscode.EventEmitter<any>();
  readonly onDidChangeTreeData: vscode.Event<any> =
    this._onDidChangeTreeData.event;

  protected async getTree() {
    return RelationService.getTree();
  }
}

export function refresh() {
  relationExplorerView.refresh();
}
