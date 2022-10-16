import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ICheckResultView, IFileContents } from "relation2-core";
import {
  UpdateRelation,
  UpdateRelationOption,
  PartTypeEnum,
  getFileContentKey,
  UpdateRelationRef,
} from "relation2-react";

import "./UpdateRelationDialog.scss";

export const getUpdateRelationData = (
  checkResult: ICheckResultView,
  fileContents: IFileContents
) => {
  const fromRev = checkResult.fromRev;
  const fromRange = checkResult.fromRange;
  const toRev = checkResult.toRev;
  const toRange = checkResult.toRange;

  const fromOptions = [
    {
      label: fromRev,
      rev: fromRev,
      content: fileContents[getFileContentKey(checkResult, PartTypeEnum.FROM)],
      range: fromRange,
    },
    {
      label: "HEAD",
      rev: "HEAD",
      content:
        fileContents[
          getFileContentKey({ ...checkResult, fromRev: "" }, PartTypeEnum.FROM)
        ],
      range: checkResult.fromModifiedRange,
    },
  ];

  const toOptions = [
    {
      label: toRev,
      rev: toRev,
      content: fileContents[getFileContentKey(checkResult, PartTypeEnum.TO)],
      range: toRange,
    },
    {
      label: "HEAD",
      rev: "HEAD",
      content:
        fileContents[
          getFileContentKey({ ...checkResult, toRev: "" }, PartTypeEnum.TO)
        ],
      range: checkResult.toModifiedRange,
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
