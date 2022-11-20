import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CreateRelations,
  ICreateRelationsRef,
  IRelation,
  RelationTypeEnum,
} from "relation2-react";

import "./createRelations.scss";

const Page = () => {
  const [fromRev, setFromRev] = useState("");
  const [toRev, setToRev] = useState("");
  const [relations, setRelations] = useState<IRelation[]>([]);
  const [fromContent, setFromContent] = useState("");
  const [toContent, setToContent] = useState("");

  const createRelationsRef = useRef<ICreateRelationsRef>(null);

  const onFromRevChange = (rev: string) => {
    window.vsCodeApi.postMessage({
      type: "relationFromRevChange",
      payload: {
        rev,
      },
    });
    setFromRev(rev);
  };

  const onToRevChange = (rev: string) => {
    window.vsCodeApi.postMessage({
      type: "relationToRevChange",
      payload: {
        rev,
      },
    });
    setToRev(rev);
  };

  useEffect(() => {
    const listener = (event: any) => {
      const message = event.data;
      switch (message.type) {
        case "relationSetFromContent":
          setFromContent(message.payload.content);
          return;

        case "relationSetToContent":
          setToContent(message.payload.content);
          return;

        case "relationSetRelations":
          setRelations(
            message.payload.relations.map((d: any) => {
              return {
                ...d,
                type: RelationTypeEnum.relate,
              };
            })
          );
          return;

        case "relationError":
          return;
      }
    };
    window.addEventListener("message", listener);

    return () => {
      window.removeEventListener("message", listener);
    };
  }, [setFromContent, setToContent, setRelations]);

  return (
    <main className={"create-relations"}>
      <header className="create-relations__header">
        <ul className="create-relations__header__list">
          <li className="create-relations__header__list__item">
            <button
              onClick={() => {
                window.vsCodeApi.postMessage({
                  type: "relationCreateRelations",
                  payload: {
                    relations,
                  },
                });
              }}
            >
              Submit
            </button>
          </li>
          <li className="create-relations__header__list__item">
            <button
              onClick={() => {
                window.vsCodeApi.postMessage({
                  type: "relationAutoGenerateRelations",
                  payload: {},
                });
              }}
            >
              Auto Generate Relations
            </button>
          </li>
        </ul>
      </header>
      <CreateRelations
        ref={createRelationsRef}
        fromContent={fromContent}
        toContent={toContent}
        fromRev={fromRev}
        toRev={toRev}
        relations={relations}
        onRelationsChange={setRelations}
        onFromRevChange={onFromRevChange}
        onToRevChange={onToRevChange}
      />
    </main>
  );
};

const rootEl = document.getElementById("root");

if (rootEl) {
  createRoot(rootEl).render(
    <div className="create-relations-page">
      <Page />
    </div>
  );
}
