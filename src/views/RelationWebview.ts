import * as vscode from "vscode";
import * as nls from "vscode-nls";

import { IRawRelation, Relation, RelationServer } from "relation2-core";
import stringifyJsonScriptContent from "stringify-json-script-content";
import { IRelation, IRelationContainer } from "..";
import createRelation from "../core/createRelation";
import { context } from "../share";
import { getNonce } from "../util";

const localize = nls.loadMessageBundle();

const i18nText = {};

// TODO: listen form and to file change

export class RelationWebview {
  public static readonly viewType = "vscode-relation.RelationWebview";

  private panel: vscode.WebviewPanel;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly relation:
      | IRelationContainer
      | (IRelation & { detailMode?: boolean })
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

    this.loadPage();
  }

  private async loadPage() {
    const html = await this.getHtmlForWebview(this.panel.webview);
    this.panel.webview.html = html;
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

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    const relationServer = new RelationServer(
      this.relation?.workspaceFolderUri?.path
    );

    const relationInstance = new Relation({
      workingDirectory: this.relation?.workspaceFolderUri?.path,
      fromPath: this.relation?.fromPath,
      toPath: this.relation?.toPath,
    });

    const relationViewerData = await relationServer.getRelationViewerData({
      fromPath: this.relation.fromPath,
      toPath: this.relation.toPath,
    });

    const escapedRelationViewerDataJSONString = stringifyJsonScriptContent(
      relationViewerData,
      null,
      2
    );

    webview.onDidReceiveMessage(({ type, payload }) => {
      (async () => {
        const cwd = this.relation.workspaceFolderUri?.path;
        switch (type) {
          case "submitCreateRelation":
            if (this.relation.fromPath && this.relation.toPath) {
              const relation = new Relation({
                workingDirectory: cwd,
                fromPath: this.relation.fromPath,
                toPath: this.relation.toPath,
              });

              createRelation({
                fromAbsolutePath: relation.fromAbsolutePath,
                toAbsolutePath: relation.toAbsolutePath,
                fromRange: [+payload.fromStartLine, +payload.fromEndLine],
                toRange: [+payload.toStartLine, +payload.toEndLine],
              });
            }
            return;

          case "submitUpdateRelation": {
            await relationServer.updateById(payload.id, async (relation) => {
              relation.fromRange = payload.fromRange;
              relation.toRange = payload.toRange;

              if (payload.fromOptionValue === "fromModified") {
                await relation.autoSetFromRev();
              }

              if (payload.toOptionValue === "toModified") {
                await relation.autoSetToRev();
              }

              return relation;
            });

            await this.loadPage();
          }

          case "relationDetailButtonClick":
            new RelationWebview(context, {
              ...this.relation,
              id: payload.id,
              detailMode: true,
            });
            return;

          case "relationDeleteButtonClick": {
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

            relationServer.write(
              relationServer.filter((relation: IRawRelation) => {
                return relation.id !== payload.id;
              })
            );

            await this.loadPage();

            return;
          }

          case "relationFromFileSave": {
            const relation = this.relation as IRelation;

            if (relation.fromPath) {
              await vscode.workspace.fs.writeFile(
                vscode.Uri.file(relationInstance.fromAbsolutePath),
                Uint8Array.from(Buffer.from(payload.content))
              );
            }

            this.loadPage();

            return;
          }

          case "relationToFileSave": {
            const relation = this.relation as IRelation;

            if (relation.toPath) {
              await vscode.workspace.fs.writeFile(
                vscode.Uri.file(relationInstance.toAbsolutePath),
                Uint8Array.from(Buffer.from(payload.content))
              );
            }

            this.loadPage();

            return;
          }

          case "relationOpenFromFileButtonClick": {
            const relation = this.relation as IRelation;

            if (relation.fromPath) {
              vscode.commands.executeCommand(
                "vscode.open",
                vscode.Uri.file(relationInstance.fromAbsolutePath)
              );
            }

            return;
          }

          case "relationOpenToFileButtonClick": {
            const relation = this.relation as IRelation;

            if (relation.toPath) {
              vscode.commands.executeCommand(
                "vscode.open",
                vscode.Uri.file(relationInstance.toAbsolutePath)
              );
            }

            return;
          }
        }
      })();
    });

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
				<link href="${styleUri}" rel="stylesheet" />

        <script nonce="${nonce}" src="${globalErrorHandlerUri}"></script>
        <script type="module" nonce="${nonce}" src="${toolkitUri}"></script>

				<title>Relation</title>
			</head>
			<body>
				<div id="root">
          <vscode-progress-ring></vscode-progress-ring>
        </div>
        <script id="escapedRelationViewerDataJSONString" type="application/json">
          ${escapedRelationViewerDataJSONString}
        </script>
        <script nonce="${nonce}">
          window.i18nText = ${JSON.stringify(i18nText)};
        </script>
        <script nonce="${nonce}">
          window.relationSearchParams = ${JSON.stringify({
            id: (this.relation as IRelation).id,
            detailMode: (this.relation as { detailMode: boolean }).detailMode,
          })}
        </script>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}
