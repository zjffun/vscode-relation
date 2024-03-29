import classnames from "classnames";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { IRelationViewerData } from "relation2-core";
import {
  CreateMode,
  RelationEditor,
  IRelationEditorRef,
} from "relation2-react";
import UpdateRelationDialog, {
  getUpdateRelationData,
} from "./UpdateRelationDialog";

import "./index.scss";

const escapedRelationViewerDataJSONString =
  document.getElementById("escapedRelationViewerDataJSONString")!.textContent ||
  "";

(window as any).__RELATION_VIEWER_DATA__ = JSON.parse(
  escapedRelationViewerDataJSONString
);

document.addEventListener("submitCreateRelation", (event: any) => {
  // TODO: check whether saved
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

  const [relationViewerData, setRelationViewerData] = useState(
    (window as any).__RELATION_VIEWER_DATA__ as IRelationViewerData
  );

  const [showingRelation, setShowingRelation] = useState(searchParams.id);

  if (!relationViewerData) {
    return null;
  }

  const diffEditorRef = useRef<IRelationEditorRef>({
    relationsWithOriginalContent: [],
  });

  const showDialog = (id: string) => {
    setCurrentUpdateCheckResultId(id);
    const relationWithOriginalContentInfo =
      diffEditorRef.current.relationsWithOriginalContent.find(
        (d) => d.id === id
      );

    if (!relationWithOriginalContentInfo) {
      setUpdateRelationData(null);
      return;
    }

    setUpdateRelationDialogVisible(true);
    setUpdateRelationData(
      getUpdateRelationData({
        relationWithOriginalContentInfo,
        ...relationViewerData,
      })
    );
  };

  useEffect(() => {
    const listener = (event: any) => {
      if (event.data.type === "updateRelationViewerData") {
        setRelationViewerData(event.data.payload);
        setUpdateRelationDialogVisible(false);
      }
    };

    window.addEventListener("message", listener);

    return () => {
      window.removeEventListener("message", listener);
    };
  }, []);

  return (
    <main className={"relation-overview"}>
      <header className="relation-overview__header">
        <ul className="relation-overview__header__list">
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
          relationViewerData={relationViewerData}
          options={options(showDialog)}
          ref={diffEditorRef}
          onFromSave={(editor) => {
            const content = editor?.getValue();

            window.vsCodeApi.postMessage({
              type: "relationFromFileSave",
              payload: {
                content,
              },
            });
          }}
          onToSave={(editor) => {
            const content = editor?.getValue();

            window.vsCodeApi.postMessage({
              type: "relationToFileSave",
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
            type: "submitUpdateRelation",
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
