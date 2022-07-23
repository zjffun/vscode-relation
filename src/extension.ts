import * as vscode from "vscode";
// nlsConfig must before other imports
import "./nlsConfig";

// Add a newline, wait for [Automatically create sort groups based on newlines in organize imports](https://github.com/microsoft/TypeScript/pull/48330)

import showRelation, { showRelationCommandId } from "./commands/showRelation";
import createRelation from "./commands/createRelation";
import { setContext } from "./share";
import { registerHelpAndFeedbackView } from "./views/helpAndFeedbackView";
import refreshAllView from "./views/refreshAllView";
import RelationExplorerView from "./views/RelationExplorerView";
import setCreateRelationForm from "./commands/setCreateRelationForm";
import deleteRelation, {
  deleteRelationCommandId,
} from "./commands/deleteRelation";

export const log = vscode.window.createOutputChannel("Relation");

export function activate(context: vscode.ExtensionContext) {
  setContext(context);

  new RelationExplorerView(context);

  context.subscriptions.push(
    vscode.commands.registerCommand("_vscode-relation.createRelation", () => {
      createRelation();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "_vscode-relation._createRelationFrom",
      (uri) => {
        const path = uri.path;

        if (!path) {
          return false;
        }

        setCreateRelationForm({
          type: "from",
          path,
        });
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "_vscode-relation._createRelationTo",
      (uri) => {
        const path = uri.path;

        if (!path) {
          return false;
        }

        setCreateRelationForm({
          type: "to",
          path,
        });
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(showRelationCommandId, (data) => {
      showRelation(data);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(deleteRelationCommandId, (data) => {
      deleteRelation(data);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-relation.refresh", () => {
      refreshAllView();
    })
  );

  registerHelpAndFeedbackView(context);
}

export function deactivate() {}
