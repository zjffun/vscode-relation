import * as vscode from "vscode";
import * as nls from "vscode-nls";
import createRelation from "../core/createRelation";
import { context } from "../share";
import { getNonce } from "../util";

const localize = nls.loadMessageBundle();

const i18nText = {};

let relationFormWebviewSingleton: RelationFormWebview | null = null;

export class RelationFormWebview {
  public static readonly viewType = "vscode-relation.RelationFormWebview";

  private panel: vscode.WebviewPanel;

  constructor() {
    this.panel = vscode.window.createWebviewPanel(
      RelationFormWebview.viewType,
      `RelationForm`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.getHtmlForWebview(this.panel.webview).then((html) => {
      this.panel.webview.html = html;
    });
  }

  public postMessage({ type, payload }: { type: string; payload: any }) {
    this.panel.webview.postMessage({ type, payload });
  }

  public reveal() {
    this.panel.reveal();
  }

  private async getHtmlForWebview(webview: vscode.Webview): Promise<string> {
    const { checkRelations } = await new Function(
      `return new Promise((res) => res(import("relation2")))`
    )();

    // Local path to script and css for the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, "out-view", "main.js")
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(context.extensionUri, "out-view", "main.css")
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

    const relationScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        context.extensionUri,
        "node_modules",
        "relation2",
        "dist",
        "view",
        "form.js"
      )
    );

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    webview.onDidReceiveMessage(({ type, payload }) => {
      switch (type) {
        case "submitRelationFormData":
          const formData = Object.fromEntries(payload);
          createRelation({
            formPath: formData["source.from.path"],
            toPath: formData["source.to.path"],
          });
          return;
      }
    });

    // const relations = await checkRelations({
    //   cwd: this.relation.workspaceFolderUri.path,
    // });

    // const relationsJSONString = JSON.stringify(
    //   Array.from(relations.values()),
    //   (key, value: any) => {
    //     if (value instanceof Map) {
    //       return Array.from(value.entries());
    //     }
    //     return value;
    //   },
    //   2
    // );

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
        <script nonce="${nonce}">
          window.i18nText = ${JSON.stringify(i18nText)}
        </script>
        <script nonce="${nonce}">
          window.addEventListener("message", (event) => {
            const message = event.data;
            switch (message.type) {
              case "setFormData":
                console.log(message)
                document.dispatchEvent(new CustomEvent("setRelationFormData", {
                  detail: {
                    formData: message.payload,
                    merge: true,
                  },
                }))
                return;
            }
          });
          document.addEventListener("submitRelationFormData", (event) => {
            window.vsCodeApi.postMessage({
              type: "submitRelationFormData",
              payload: [...event.detail.entries()]
            });
          });
        </script>
				<script nonce="${nonce}" src="${scriptUri}"></script>
        <script nonce="${nonce}" src="${relationScriptUri}"></script>
			</body>
			</html>`;
  }

  static singleton() {
    if (relationFormWebviewSingleton) {
      return relationFormWebviewSingleton;
    }
    return (relationFormWebviewSingleton = new RelationFormWebview());
  }
}
