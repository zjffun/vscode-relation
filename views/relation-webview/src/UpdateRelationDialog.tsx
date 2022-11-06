import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IContents } from "relation2-core";
import {
  UpdateRelation,
  UpdateRelationOption,
  UpdateRelationRef,
  IRelationWithOriginalContentInfo,
} from "relation2-react";

import "./UpdateRelationDialog.scss";

export const getUpdateRelationData = (
  relationWithOriginalContentInfo: IRelationWithOriginalContentInfo,
  contents: IContents
) => {
  const fromRev = relationWithOriginalContentInfo.fromGitRev;
  const fromRange = relationWithOriginalContentInfo.fromRange;
  const toRev = relationWithOriginalContentInfo.toGitRev;
  const toRange = relationWithOriginalContentInfo.toRange;

  const fromOptions = [
    {
      label: fromRev,
      rev: fromRev,
      content: contents[relationWithOriginalContentInfo.fromOriginalContentRev],
      range: fromRange,
    },
    {
      label: "HEAD",
      rev: "HEAD",
      content:
        contents[relationWithOriginalContentInfo._modifiedFromContentRev],
      range: relationWithOriginalContentInfo.fromModifiedRange,
    },
  ];

  const toOptions = [
    {
      label: toRev,
      rev: toRev,
      content: contents[relationWithOriginalContentInfo.toOriginalContentRev],
      range: toRange,
    },
    {
      label: "HEAD",
      rev: "HEAD",
      content: contents[relationWithOriginalContentInfo._modifiedToContentRev],
      range: relationWithOriginalContentInfo.toModifiedRange,
    },
  ];

  return {
    fromRev,
    fromRange,
    toRev,
    toRange,
    fromOptions,
    toOptions,
  };
};

const UpdateRelationDialog = ({
  visible,
  onSave,
  onClose,
  updateRelationData,
}: {
  visible: boolean;
  onSave: (data: {
    fromRev: string;
    fromRange: [number, number];
    toRev: string;
    toRange: [number, number];
  }) => void;
  onClose: () => void;
  updateRelationData: {
    fromRev: string;
    fromRange: [number, number];
    toRev: string;
    toRange: [number, number];
    fromOptions: UpdateRelationOption[];
    toOptions: UpdateRelationOption[];
  };
}) => {
  if (!updateRelationData) {
    return null;
  }

  const updateRelationRef = useRef<UpdateRelationRef>(null);
  const updateRelationDialogElRef = useRef<HTMLDialogElement>(null);
  const [fromRev, setFromRev] = useState(updateRelationData.fromRev);
  const [fromRange, setFromRange] = useState(updateRelationData.fromRange);
  const [toRev, setToRev] = useState(updateRelationData.toRev);
  const [toRange, setToRange] = useState(updateRelationData.toRange);

  const setDefaultRange = () => {
    const fromRange = updateRelationData.fromOptions?.find(
      (d) => d.rev === fromRev
    )?.range;

    if (fromRange) {
      setFromRange(fromRange);
    } else {
      setFromRange([0, 0]);
    }

    const toRange = updateRelationData.toOptions?.find(
      (d) => d.rev === toRev
    )?.range;

    if (toRange) {
      setToRange(toRange);
    } else {
      setToRange([0, 0]);
    }
  };

  useEffect(() => {
    if (!updateRelationDialogElRef.current) {
      return;
    }

    if (visible && !updateRelationDialogElRef.current.open) {
      updateRelationDialogElRef.current.show();
      setDefaultRange();
      updateRelationRef.current?.layout();
      return;
    }

    if (!visible && updateRelationDialogElRef.current.open) {
      updateRelationDialogElRef.current.close();
      return;
    }
  }, [visible]);

  return createPortal(
    <dialog className="updateRelationDialog" ref={updateRelationDialogElRef}>
      <div>
        <button
          onClick={() => {
            onSave({
              fromRev,
              fromRange,
              toRev,
              toRange,
            });
          }}
        >
          Save
        </button>
        <button onClick={onClose}>Close</button>
      </div>
      <UpdateRelation
        ref={updateRelationRef}
        fromRev={fromRev}
        fromRange={fromRange}
        toRev={toRev}
        toRange={toRange}
        fromOptions={updateRelationData.fromOptions}
        toOptions={updateRelationData.toOptions}
        onFromRevChange={setFromRev}
        onFromRangeChange={setFromRange}
        onToRevChange={setToRev}
        onToRangeChange={setToRange}
      />
    </dialog>,
    document.body
  );
};

export default UpdateRelationDialog;
