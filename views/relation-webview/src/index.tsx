import classnames from "classnames";
import { MouseEventHandler, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { IViewData } from "relation2-core";
import {
  getRelationByCheckResult,
  MonacoDiffEditorRelation,
} from "relation2-react";

import "./index.scss";

const checkResultsJSONString =
  document.getElementById("viewCheckResultsText")!.textContent || "";

(window as any).__VIEW_CHECK_RESULTS__ = JSON.parse(checkResultsJSONString);

document.addEventListener("submitCreateRelation", (event: any) => {
  window.vsCodeApi.postMessage({
    type: "submitCreateRelation",
    payload: event.detail,
  });
});

document.addEventListener("relationDetailButtonClick", (event: any) => {
  window.vsCodeApi.postMessage({
    type: "relationDetailButtonClick",
    payload: event.detail,
  });
});

document.addEventListener("relationDeleteButtonClick", (event: any) => {
  window.vsCodeApi.postMessage({
    type: "relationDeleteButtonClick",
    payload: event.detail,
  });
});

let searchParams = (window as any).relationSearchParams;

if (!searchParams) {
  const sp = new URL(document.location.href).searchParams;
  searchParams = {};
  sp.forEach((value, key) => {
    searchParams[key] = value;
  });
}

const options = (data: any) => {
  const payload = {
    id: data.id,
    fromModifiedRange: data.fromModifiedRange,
    toModifiedRange: data.toModifiedRange,
  };

  const OptionsComponent = () => {
    const dialogElRef = useRef<HTMLDialogElement>(null);

    const showDialog: MouseEventHandler<HTMLButtonElement> = (e) => {
      const { bottom, right } = (
        e.target as HTMLButtonElement
      ).getBoundingClientRect();

      if (dialogElRef.current?.style) {
        dialogElRef.current.style.top = `${bottom}px`;
        dialogElRef.current.style.right = `${window.innerWidth - right}px`;
      }

      dialogElRef.current?.showModal();
    };

    return (
      <>
        <button onClick={showDialog}>more</button>
        {createPortal(
          <dialog className="optionsDialog" ref={dialogElRef}>
            <button
              onClick={() => {
                window.vsCodeApi.postMessage({
                  type: "relationUpdateFromClick",
                  payload,
                });

                dialogElRef.current?.close();
              }}
            >
              update from
            </button>
            <button
              onClick={() => {
                window.vsCodeApi.postMessage({
                  type: "relationUpdateToClick",
                  payload,
                });

                dialogElRef.current?.close();
              }}
            >
              update to
            </button>
            <button
              onClick={() => {
                window.vsCodeApi.postMessage({
                  type: "relationUpdateBothClick",
                  payload,
                });

                dialogElRef.current?.close();
              }}
            >
              update both
            </button>
          </dialog>,
          document.body
        )}
      </>
    );
  };

  return <OptionsComponent></OptionsComponent>;
};

const Page = () => {
  const [showOptions, setShowOptions] = useState(false);

  const [viewCheckResults, setviewCheckResults] = useState(
    (window as any).__VIEW_CHECK_RESULTS__ as IViewData
  );

  const [showingRelation, setShowingRelation] = useState(searchParams.id);

  if (!viewCheckResults?.originalAndModifiedContent) {
    return null;
  }

  const diffEditorRef = useRef<{
    diffEditorRef?: any;
  }>({});

  return (
    <main className={"relation-overview"}>
      <header className="relation-overview__header">
        <ul className="relation-overview__header__list">
          <li>
            <button
              onClick={() => {
                window.vsCodeApi.postMessage({
                  type: "relationResetRelationsClick",
                });
              }}
            >
              Reset Relations
            </button>
            <button
              onClick={() => {
                window.vsCodeApi.postMessage({
                  type: "relationUpdateRelationsClick",
                });
              }}
            >
              Update Relations
            </button>
            <label>
              <input
                type="checkbox"
                checked={showOptions}
                onChange={(e) => setShowOptions(e.target.checked)}
              />
              Show Options
            </label>
            <button
              onClick={() => {
                window.vsCodeApi.postMessage({
                  type: "relationOpenFromFileButtonClick",
                });
              }}
            >
              Open From File
            </button>
            <button
              onClick={() => {
                window.vsCodeApi.postMessage({
                  type: "relationOpenToFileButtonClick",
                });
              }}
            >
              Open To File
            </button>
          </li>
        </ul>
      </header>
      <section
        className={classnames({
          "relation-overview__relations": true,
          "relation-overview__relations--show-options": showOptions,
        })}
      >
        <MonacoDiffEditorRelation
          fromOriginal={
            viewCheckResults.originalAndModifiedContent.fromOriginalContent
          }
          fromModified={
            viewCheckResults.originalAndModifiedContent.fromModifiedContent
          }
          toOriginal={
            viewCheckResults.originalAndModifiedContent.toOriginalContent
          }
          toModified={
            viewCheckResults.originalAndModifiedContent.toModifiedContent
          }
          relations={viewCheckResults.checkResults.map((d: any) => {
            return getRelationByCheckResult(d);
          })}
          options={options}
          ref={diffEditorRef}
          onFromSave={(editor) => {
            const content = editor?.getValue();

            window.vsCodeApi.postMessage({
              type: "relationFromSave",
              payload: {
                content,
              },
            });
          }}
          onToSave={(editor) => {
            const content = editor?.getValue();

            window.vsCodeApi.postMessage({
              type: "relationToSave",
              payload: {
                content,
              },
            });
          }}
        ></MonacoDiffEditorRelation>
      </section>
    </main>
  );
};

const rootEl = document.getElementById("root");

if (rootEl) {
  createRoot(rootEl).render(
    <div className="relation-view-page">
      <Page />
    </div>
  );
}
