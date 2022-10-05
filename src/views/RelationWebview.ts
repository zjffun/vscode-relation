import * as path from "path";
import * as vscode from "vscode";
import * as nls from "vscode-nls";

import { pick } from "lodash";
import {
  getKey,
  GitServer,
  IRawRelation,
  RelationServer,
} from "relation2-core";
import stringifyJsonScriptContent from "stringify-json-script-content";
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

    const relationsKey = getKey(this.relation as IRelation);

    const checkResults = await relationServer.filterByRelationsKey(
      relationsKey
    );

    const fileContents = await relationServer.getFileContentsByKey(
      relationsKey
    );

    const viewCheckResults = {
      key: relationsKey,
      checkResults,
      ...pick(checkResults[0], [
        "fromPath",
        "fromBaseDir",
        "toPath",
        "toBaseDir",
        "currentFromRev",
        "currentToRev",
      ]),
      fileContents,
    };

    const escapedViewCheckResultsJSONString = stringifyJsonScriptContent(
      viewCheckResults,
      null,
      2
    );

    webview.onDidReceiveMessage(({ type, payload }) => {
      (async () => {
        const cwd = this.relation.workspaceFolderUri?.path;
        switch (type) {
          case "submitCreateRelation":
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
              relationServer.filter((currentRelation: IRawRelation) => {
                return currentRelation.id !== payload.id;
              })
            );

            return;
          }

          case "relationUpdateFromClick": {
            const checkResult = checkResults.find((d) => d.id === payload.id);

            if (!checkResult) {
              return;
            }

            const fromRev = await GitServer.parseRev(
              cwd,
              "HEAD",
              checkResult.fromBaseDir
            );

            const answer = await vscode.window.showWarningMessage(
              `Do you want to update ${payload.id} fromRev to HEAD(${fromRev})?`,
              {
                modal: true,
              },
              "Yes"
            );

            if (answer !== "Yes") {
              return;
            }

            relationServer.updateById(payload.id, {
              fromRev,
              fromRange: payload.fromModifiedRange,
            });

            return;
          }
          case "relationUpdateToClick": {
            const checkResult = checkResults.find((d) => d.id === payload.id);

            if (!checkResult) {
              return;
            }

            const toRev = await GitServer.parseRev(
              cwd,
              "HEAD",
              checkResult.toBaseDir
            );

            const answer = await vscode.window.showWarningMessage(
              `Do you want to update ${payload.id} toRev to HEAD(${toRev})?`,
              {
                modal: true,
              },
              "Yes"
            );

            if (answer !== "Yes") {
              return;
            }

            relationServer.updateById(payload.id, {
              toRev,
              toRange: payload.toModifiedRange,
            });

            return;
          }
          case "relationUpdateBothClick": {
            const checkResult = checkResults.find((d) => d.id === payload.id);

            if (!checkResult) {
              return;
            }

            const fromRev = await GitServer.parseRev(
              cwd,
              "HEAD",
              checkResult.fromBaseDir
            );

            const toRev = await GitServer.parseRev(
              cwd,
              "HEAD",
              checkResult.toBaseDir
            );

            const answer = await vscode.window.showWarningMessage(
              `Do you want to update ${payload.id} fromRev to HEAD(${fromRev} and toRev to HEAD(${toRev})?`,
              {
                modal: true,
              },
              "Yes"
            );

            if (answer !== "Yes") {
              return;
            }

            relationServer.updateById(payload.id, {
              fromRev,
              toRev,
              fromRange: payload.fromModifiedRange,
              toRange: payload.toModifiedRange,
            });

            return;
          }
          case "relationUpdateRelationsClick": {
            const checkResult = checkResults[0];

            if (!checkResult) {
              return;
            }

            const fromRev = await GitServer.parseRev(
              cwd,
              "HEAD",
              checkResult.fromBaseDir
            );

            const toRev = await GitServer.parseRev(
              cwd,
              "HEAD",
              checkResult.toBaseDir
            );

            const answer = await vscode.window.showWarningMessage(
              `Do you want to update relations fromRev to HEAD(${fromRev} and toRev to HEAD(${toRev})?`,
              {
                modal: true,
              },
              "Yes"
            );

            if (answer !== "Yes") {
              return;
            }

            for (const checkResult of payload.checkResults) {
              relationServer.updateById(checkResult.id, {
                fromRev,
                toRev,
                fromRange: checkResult.fromModifiedRange,
                toRange: checkResult.toModifiedRange,
              });
            }

            await this.loadPage();

            return;
          }

          case "relationToSave": {
            const relation = this.relation as IRelation;

            if (
              relation.workspaceFolderUri &&
              relation.toBaseDir !== undefined &&
              relation.toPath !== undefined
            ) {
              await vscode.workspace.fs.writeFile(
                vscode.Uri.joinPath(
                  relation.workspaceFolderUri,
                  relation.toBaseDir,
                  relation.toPath
                ),
                Uint8Array.from(Buffer.from(payload.content))
              );
            }

            this.loadPage();

            return;
          }
          case "relationFromSave": {
            const relation = this.relation as IRelation;

            if (
              relation.workspaceFolderUri &&
              relation.fromBaseDir !== undefined &&
              relation.fromPath !== undefined
            ) {
              await vscode.workspace.fs.writeFile(
                vscode.Uri.joinPath(
                  relation.workspaceFolderUri,
                  relation.fromBaseDir,
                  relation.fromPath
                ),
                Uint8Array.from(Buffer.from(payload.content))
              );
            }

            this.loadPage();

            return;
          }

          case "relationResetRelationsClick": {
            const relation = this.relation as IRelation;

            const answer = await vscode.window.showWarningMessage(
              `Do you want to update relations?`,
              {
                modal: true,
              },
              "Yes"
            );

            if (answer !== "Yes") {
              return;
            }

            if (cwd) {
              const filteredRelations = relationServer.filter(
                (tempRelation) => {
                  return getKey(tempRelation) !== getKey(relation);
                }
              );
              const newRelations = await relationServer.createMarkdownRelations(
                {
                  fromRev: "HEAd",
                  fromPath: path.join(
                    cwd,
                    relation.fromBaseDir,
                    relation.fromPath
                  ),
                  toRev: "HEAD",
                  toPath: path.join(cwd, relation.toBaseDir, relation.toPath),
                }
              );

              relationServer.write([...filteredRelations, ...newRelations]);
            }

            this.loadPage();

            return;
          }

          case "relationOpenFromFileButtonClick": {
            const relation = this.relation as IRelation;

            if (
              relation.workspaceFolderUri &&
              relation.fromBaseDir !== undefined &&
              relation.fromPath !== undefined
            ) {
              vscode.commands.executeCommand(
                "vscode.open",
                vscode.Uri.joinPath(
                  relation.workspaceFolderUri,
                  relation.fromBaseDir,
                  relation.fromPath
                )
              );
            }

            return;
          }

          case "relationOpenToFileButtonClick": {
            const relation = this.relation as IRelation;

            if (
              relation.workspaceFolderUri &&
              relation.toBaseDir !== undefined &&
              relation.toPath !== undefined
            ) {
              vscode.commands.executeCommand(
                "vscode.open",
                vscode.Uri.joinPath(
                  relation.workspaceFolderUri,
                  relation.toBaseDir,
                  relation.toPath
                )
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
        <script id="viewCheckResultsText" type="application/json">
          ${escapedViewCheckResultsJSONString}
        </script>
        <script nonce="${nonce}">
          window.i18nText = ${JSON.stringify(i18nText)};
        </script>
        <script nonce="${nonce}">
          window.relationSearchParams = ${JSON.stringify({
            id: (this.relation as IRelation).id,
            relationsKey,
            detailMode: (this.relation as { detailMode: boolean }).detailMode,
          })}
        </script>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }
}
