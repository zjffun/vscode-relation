import classnames from "classnames";
import { useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { IViewData } from "relation2-core";
import { CreateMode, RelationEditor } from "relation2-react";
import UpdateRelationDialog, {
  getUpdateRelationData,
} from "./UpdateRelationDialog";

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

const options = (showDialog: (id: string) => void) => (data: any) => {
  const OptionsComponent = () => {
    return (
      <>
        <button
          onClick={() => {
            window.vsCodeApi.postMessage({
              type: "relationDeleteButtonClick",
              payload: {
                id: data.id,
              },
            });
          }}
        >
          Delete
        </button>
        <button onClick={() => showDialog(data.id)}>Update</button>
      </>
    );
  };

  return <OptionsComponent></OptionsComponent>;
};

const Page = () => {
  const [showOptions, setShowOptions] = useState(false);
  const [updateRelationDialogVisible, setUpdateRelationDialogVisible] =
    useState(false);
  const [updateRelationData, setUpdateRelationData] = useState<any>(null);
  const [currentUpdateCheckResultId, setCurrentUpdateCheckResultId] =
    useState("");

  const [viewCheckResults, setviewCheckResults] = useState(
    (window as any).__VIEW_CHECK_RESULTS__ as IViewData
  );

  const [showingRelation, setShowingRelation] = useState(searchParams.id);

  if (!viewCheckResults?.fileContents) {
    return null;
  }

  const diffEditorRef = useRef<{
    diffEditorRef?: any;
  }>({});

  const showDialog = (id: string) => {
    setCurrentUpdateCheckResultId(id);
    const checkResult = viewCheckResults.checkResults.find((d) => d.id === id);

    if (!checkResult) {
      setUpdateRelationData(null);
      return;
    }

    setUpdateRelationDialogVisible(true);
    setUpdateRelationData(
      getUpdateRelationData(checkResult, viewCheckResults.fileContents)
    );
  };

  return (
    <main className={"relation-overview"}>
      <header className="relation-overview__header">
        <ul className="relation-overview__header__list">
          <li className="relation-overview__header__list__item">
            <button
              onClick={() => {
                window.vsCodeApi.postMessage({
                  type: "relationUpdateRelationsClick",
                  payload: {
                    checkResults: viewCheckResults.checkResults,
                  },
                });
              }}
            >
              Update Relations
            </button>
          </li>
          <li className="relation-overview__header__list__item">
            <button
              onClick={() => {
                window.vsCodeApi.postMessage({
                  type: "relationOpenFromFileButtonClick",
                });
              }}
            >
              Open From File
            </button>
          </li>
          <li className="relation-overview__header__list__item">
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
          <li className="relation-overview__header__list__item">
            <button
              onClick={() => {
                window.vsCodeApi.postMessage({
                  type: "relationResetRelationsClick",
                });
              }}
            >
              Reset Relations
            </button>
          </li>
          <li className="relation-overview__header__list__item">
            <label>
              <input
                type="checkbox"
                checked={showOptions}
                onChange={(e) => setShowOptions(e.target.checked)}
              />
              Show Options
            </label>
          </li>
          <li className="relation-overview__header__list__item">
            <CreateMode
              onCreate={(data) => {
                window.vsCodeApi.postMessage({
                  type: "submitCreateRelation",
                  payload: data,
                });
              }}
            />
          </li>
        </ul>
      </header>
      <section
        className={classnames({
          "relation-overview__relations": true,
          "relation-overview__relations--show-options": showOptions,
        })}
      >
        <RelationEditor
          checkResults={viewCheckResults.checkResults}
          fileContents={viewCheckResults.fileContents}
          options={options(showDialog)}
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
        />
      </section>
      <UpdateRelationDialog
        visible={updateRelationDialogVisible}
        onSave={(data) => {
          window.vsCodeApi.postMessage({
            type: "relationUpdate",
            payload: {
              id: currentUpdateCheckResultId,
              ...data,
            },
          });
        }}
        onClose={() => setUpdateRelationDialogVisible(false)}
        updateRelationData={updateRelationData}
      />
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
