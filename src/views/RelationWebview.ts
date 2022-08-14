import * as path from "path";
import * as vscode from "vscode";
import * as nls from "vscode-nls";

import { checkRelations, filterRelation, IRawRelation } from "relation2-core";
import { IRelation, IRelationContainer } from "..";
import insertRelation from "../core/insertRelation";
import { context } from "../share";
import { getNonce } from "../util";

const localize = nls.loadMessageBundle();

const i18nText = {};

export class RelationWebview {
  public static readonly viewType = "vscode-relation.RelationWebview";

  private panel: vscode.WebviewPanel;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly relation: IRelationContainer | IRelation
  ) {
    let subTitle = relation.name;
    if (!(relation as IRelationContainer).children) {
      subTitle = `${(relation as IRelation).fromPath}#${relation.name}`;
    }

    const title = `Relation ${subTitle}`;

    this.panel = vscode.window.createWebviewPanel(
      RelationWebview.viewType,
      title,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
      }
    );

    this.getHtmlForWebview(this.panel.webview).then((html) => {
      this.panel.webview.html = html;
    });
  }

  private async getHtmlForWebview(webview: vscode.Webview): Promise<string> {
    // Local path to script and css for the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "out-view", "main.js")
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "out-view", "main.css")
    );

    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "node_modules",
        "@vscode/codicons",
        "dist",
        "codicon.css"
      )
    );

    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "reset.css")
    );

    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "vscode.css")
    );

    const globalErrorHandlerUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "media",
        "globalErrorHandler.js"
      )
    );

    const toolkitUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "node_modules",
        "@vscode",
        "webview-ui-toolkit",
        "dist",
        "toolkit.js"
      )
    );

    const relationScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "node_modules",
        "relation2-page",
        "dist",
        "relationView.js"
      )
    );

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    webview.onDidReceiveMessage(({ type, payload }) => {
      switch (type) {
        case "submitCreateRelation":
          const cwd = this.relation.workspaceFolderUri?.path;
          if (cwd && this.relation.fromPath && this.relation.toPath) {
            insertRelation({
              fromPath: path.join(cwd, this.relation.fromPath),
              toPath: path.join(cwd, this.relation.toPath),
              fromRange: [+payload.fromStartLine, +payload.fromEndLine],
              toRange: [+payload.toStartLine, +payload.toEndLine],
            });
          }
          return;
        case "relationDetailButtonClick":
          new RelationWebview(context, { ...this.relation, id: payload.id });
          return;
        case "relationDeleteButtonClick":
          (async () => {
            const answer = await vscode.window.showWarningMessage(
              `Do you want to delete relation ${payload.id}?`,
              {
                modal: true,
              },
              "Delete"
            );

            if (answer !== "Delete") {
              return;
            }

            filterRelation(
              (currentRelation: IRawRelation) => {
                return currentRelation.id !== payload.id;
              },
              {
                cwd: this.relation.workspaceFolderUri?.path,
              }
            );
          })();

          return;
      }
    });

    const relations = await checkRelations({
      cwd: this.relation?.workspaceFolderUri?.path,
    });

    const relationsJSONString = JSON.stringify(
      Array.from(relations.values()),
      (key, value: any) => {
        if (value instanceof Map) {
          return Array.from(value.entries());
        }
        return value;
      },
      2
    );

    return /* html */ `
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none';
          img-src ${webview.cspSource};
          style-src ${webview.cspSource} 'unsafe-inline';
          font-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
        <meta property="csp-nonce" content="${nonce}" />
       
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
        
				<link href="${codiconsUri}" rel="stylesheet" />
				<link href="${styleResetUri}" rel="stylesheet" />
				<link href="${styleVSCodeUri}" rel="stylesheet" />
				<!-- <link href="${styleUri}" rel="stylesheet" /> -->

        <script nonce="${nonce}" src="${globalErrorHandlerUri}"></script>
        <script type="module" nonce="${nonce}" src="${toolkitUri}"></script>

				<title>Relation</title>
			</head>
			<body>
				<div id="root">
          <vscode-progress-ring></vscode-progress-ring>
        </div>
        <script id="relationText" type="text">
          ${relationsJSONString.replaceAll(
            "</script>",
            "<___REPLACE_SCRIPT_TAG____/script>"
          )}
        </script>
        <script nonce="${nonce}">
          window.i18nText = ${JSON.stringify(i18nText)};
        </script>
        <script nonce="${nonce}">
          window.relationSearchParams = ${JSON.stringify({
            id: (this.relation as IRelation).id,
            fromPath: (this.relation as IRelation).fromPath,
          })}
        </script>
				<script nonce="${nonce}" src="${scriptUri}"></script>
        <script nonce="${nonce}" src="${relationScriptUri}"></script>
			</body>
			</html>`;
  }
}
