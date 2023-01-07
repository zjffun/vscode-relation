import * as path from "node:path";
import { Relation, RelationServer } from "relation2-core";
import * as vscode from "vscode";
import * as nls from "vscode-nls";
import { context } from "../share";
import { getNonce } from "../util";

const localize = nls.loadMessageBundle();

const i18nText = {};

let CreateRelationsWebviewSingleton: CreateRelationsWebview | null = null;

export class CreateRelationsWebview {
  public static readonly viewType = "vscode-relation.CreateRelationsWebview";

  private panel: vscode.WebviewPanel;

  public fromUri: vscode.Uri | undefined;
  public toUri: vscode.Uri | undefined;

  constructor() {
    this.panel = vscode.window.createWebviewPanel(
      CreateRelationsWebview.viewType,
      `CreateRelations`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.panel.onDidDispose(() => {
      CreateRelationsWebviewSingleton = null;
    });

    this.loadPage();
  }

  public postMessage({ type, payload }: { type: string; payload: any }) {
    this.panel.webview.postMessage({ type, payload });
  }

  public async loadPage() {
    const html = await this.getHtmlForWebview(this.panel.webview);
    this.panel.webview.html = html;
  }

  public reveal() {
    this.panel.reveal();
  }

  public async setFromContent(rev: string) {
    if (!this.fromUri) {
      return;
    }
    const cwd = vscode.workspace.getWorkspaceFolder(this.fromUri!)?.uri.fsPath;
    if (!cwd) {
      return;
    }
    const relation = new Relation({
      workingDirectory: cwd,
    });

    relation.fromAbsolutePath = this.fromUri.fsPath;

    if (rev === "") {
      this.postMessage({
        type: "relationSetFromContent",
        payload: {
          content: relation.fromCurrentContent,
          rev: "",
        },
      });
      return;
    }

    await relation.setFromGitInfo({ rev });
    this.postMessage({
      type: "relationSetFromContent",
      payload: {
        content: await relation.getFromOriginalContent(),
        rev: relation.fromGitRev,
      },
    });
  }

  public async setToContent(rev: string) {
    if (!this.toUri) {
      return;
    }
    const cwd = vscode.workspace.getWorkspaceFolder(this.toUri!)?.uri.fsPath;
    if (!cwd) {
      return;
    }
    const relation = new Relation({
      workingDirectory: cwd,
    });

    relation.toAbsolutePath = this.toUri.fsPath;

    if (rev === "") {
      this.postMessage({
        type: "relationSetToContent",
        payload: {
          content: relation.toCurrentContent,
          rev: "",
        },
      });
      return;
    }

    await relation.setToGitInfo({ rev });
    this.postMessage({
      type: "relationSetToContent",
      payload: {
        content: await relation.getToOriginalContent(),
        rev: relation.toGitRev,
      },
    });
  }

  private async getHtmlForWebview(webview: vscode.Webview): Promise<string> {
    // Local path to script and css for the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        context.extensionUri,
        "out-view",
        "createRelations.js"
      )
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        context.extensionUri,
        "out-view",
        "createRelations.css"
      )
    );

    const codiconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        context.extensionUri,
        "node_modules",
        "@vscode/codicons",
        "dist",
        "codicon.css"
      )
    );

    const styleResetUri = webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, "media", "reset.css")
    );

    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, "media", "vscode.css")
    );

    const globalErrorHandlerUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        context.extensionUri,
        "media",
        "globalErrorHandler.js"
      )
    );

    const toolkitUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        context.extensionUri,
        "node_modules",
        "@vscode",
        "webview-ui-toolkit",
        "dist",
        "toolkit.js"
      )
    );

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    webview.onDidReceiveMessage(({ type, payload }) => {
      (async () => {
        switch (type) {
          case "relationFromRevChange": {
            await this.setFromContent(payload.rev);
            return;
          }
          case "relationToRevChange": {
            await this.setToContent(payload.rev);
            return;
          }
          case "relationAutoGenerateRelations": {
            const fromAbsolutePath = this.fromUri?.fsPath;
            const toAbsolutePath = this.toUri?.fsPath;

            if (!fromAbsolutePath || !toAbsolutePath) {
              return;
            }

            const cwd = vscode.workspace.getWorkspaceFolder(this.fromUri!)?.uri
              .fsPath;
            if (!cwd) {
              return;
            }

            const relationServer = new RelationServer(cwd);
            const relations = await relationServer.createMarkdownRelations({
              fromAbsolutePath: fromAbsolutePath,
              toAbsolutePath: toAbsolutePath,
            });

            this.postMessage({
              type: "relationSetRelations",
              payload: {
                relations,
              },
            });
            return;
          }
          case "relationCreateRelations": {
            const fromFullPath = this.fromUri?.fsPath;
            const toFullPath = this.toUri?.fsPath;

            if (!fromFullPath || !toFullPath) {
              return;
            }
            const cwd = vscode.workspace.getWorkspaceFolder(this.fromUri!)?.uri
              .fsPath;
            if (!cwd) {
              return;
            }

            const relationServer = new RelationServer(cwd);
            const relations = relationServer.read();

            const newRelations = [];
            for (const relation of payload.relations) {
              const relationInstance = new Relation({
                workingDirectory: cwd,
                ...relation,
              });
              newRelations.push(relationInstance);
            }

            relationServer.write([...relations, ...newRelations]);

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
        <script nonce="${nonce}">
          window.i18nText = ${JSON.stringify(i18nText)};
        </script>
        <script nonce="${nonce}">
          window.relationSearchParams = ${JSON.stringify({})}
        </script>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }

  static singleton() {
    if (CreateRelationsWebviewSingleton) {
      return CreateRelationsWebviewSingleton;
    }
    return (CreateRelationsWebviewSingleton = new CreateRelationsWebview());
  }
}
