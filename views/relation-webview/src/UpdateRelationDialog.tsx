import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IViewerContents } from "relation2-core";
import {
  IRelationWithOriginalContentInfo,
  UpdateRelation,
  UpdateRelationOption,
  UpdateRelationRef,
} from "relation2-react";

import "./UpdateRelationDialog.scss";

export const getUpdateRelationData = ({
  relationWithOriginalContentInfo,
  viewerContents,
  fromModifiedContent,
  toModifiedContent,
}: {
  relationWithOriginalContentInfo: IRelationWithOriginalContentInfo;
  viewerContents: IViewerContents;
  fromModifiedContent: string;
  toModifiedContent: string;
}) => {
  const fromOptionValue = "fromModified";
  const fromModifiedRange = relationWithOriginalContentInfo.fromModifiedRange;
  const toOptionValue = "toModified";
  const toModifiedRange = relationWithOriginalContentInfo.toModifiedRange;

  const fromOptions = [
    {
      label: "Original",
      value: "fromOriginal",
      content:
        viewerContents[
          relationWithOriginalContentInfo.originalFromViewerContentRev
        ],
      range: relationWithOriginalContentInfo.fromRange,
    },
    {
      label: "Modified",
      value: "fromModified",
      content: fromModifiedContent,
      range: fromModifiedRange,
    },
  ];

  const toOptions = [
    {
      label: "Original",
      value: "toOriginal",
      content:
        viewerContents[
          relationWithOriginalContentInfo.originalToViewerContentRev
        ],
      range: relationWithOriginalContentInfo.toRange,
    },
    {
      label: "Modified",
      value: "toModified",
      content: toModifiedContent,
      range: toModifiedRange,
    },
  ];

  return {
    fromOptionValue,
    fromRange: fromModifiedRange,
    toOptionValue,
    toRange: toModifiedRange,
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
    fromOptionValue: string;
    fromRange: [number, number];
    toOptionValue: string;
    toRange: [number, number];
  }) => void;
  onClose: () => void;
  updateRelationData: {
    fromOptionValue: string;
    fromRange: [number, number];
    toOptionValue: string;
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
  const [fromOptionValue, setFromOptionValue] = useState(
    updateRelationData.fromOptionValue
  );
  const [fromRange, setFromRange] = useState(updateRelationData.fromRange);
  const [toOptionValue, setToOptionValue] = useState(
    updateRelationData.toOptionValue
  );
  const [toRange, setToRange] = useState(updateRelationData.toRange);

  const setDefaultRange = () => {
    const fromRange = updateRelationData.fromOptions?.find(
      (d) => d.value === fromOptionValue
    )?.range;

    if (fromRange) {
      setFromRange(fromRange);
    } else {
      setFromRange([0, 0]);
    }

    const toRange = updateRelationData.toOptions?.find(
      (d) => d.value === toOptionValue
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
              fromOptionValue,
              fromRange,
              toOptionValue,
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
        fromOptionValue={fromOptionValue}
        fromRange={fromRange}
        toOptionValue={toOptionValue}
        toRange={toRange}
        fromOptions={updateRelationData.fromOptions}
        toOptions={updateRelationData.toOptions}
        onFromOptionValueChange={setFromOptionValue}
        onFromRangeChange={setFromRange}
        onToOptionValueChange={setToOptionValue}
        onToRangeChange={setToRange}
      />
    </dialog>,
    document.body
  );
};

export default UpdateRelationDialog;
