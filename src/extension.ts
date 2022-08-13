import * as vscode from "vscode";
// nlsConfig must before other imports
import "./nlsConfig";

// Add a newline, wait for [Automatically create sort groups based on newlines in organize imports](https://github.com/microsoft/TypeScript/pull/48330)

import createRelation, {
  createRelationCommandId,
} from "./commands/createRelation";
import createRelationFrom, {
  createRelationFromCommandId,
} from "./commands/createRelationFrom";
import createRelationTo, {
  createRelationToCommandId,
} from "./commands/createRelationTo";
import deleteRelation, {
  deleteRelationCommandId,
} from "./commands/deleteRelation";
import showRelation, { showRelationCommandId } from "./commands/showRelation";
import { setContext } from "./share";
import { registerHelpAndFeedbackView } from "./views/helpAndFeedbackView";
import refreshAllView from "./views/refreshAllView";
import RelationExplorerView from "./views/RelationExplorerView";
import createRelationFromRange, {
  createRelationFromRangeCommandId,
} from "./commands/createRelationFromRange";
import createRelationToRange, {
  createRelationToRangeCommandId,
} from "./commands/createRelationToRange";

export const log = vscode.window.createOutputChannel("Relation");

export function activate(context: vscode.ExtensionContext) {
  setContext(context);

  new RelationExplorerView(context);

  context.subscriptions.push(
    vscode.commands.registerCommand(createRelationCommandId, () => {
      createRelation();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(createRelationFromCommandId, (uri) => {
      createRelationFrom(uri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(createRelationToCommandId, (uri) => {
      createRelationTo(uri);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(createRelationFromRangeCommandId, () => {
      createRelationFromRange();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(createRelationToRangeCommandId, () => {
      createRelationToRange();
    })
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
