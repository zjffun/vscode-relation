import { RelationFormWebview } from "../views/RelationFormWebview";

export default async ({
  type,
  path,
  startLine,
  endLine,
}: {
  type: string;
  path: string;
  startLine?: number;
  endLine?: number;
}) => {
  const relationFormWebview = RelationFormWebview.singleton();

  relationFormWebview.reveal();
  let formConfig = "file";

  if (startLine) {
    formConfig = "fileLine";
  }

  relationFormWebview.postMessage({
    type: "setFormData",
    payload: {
      operationType: "create",
      [`source.${type}.formConfig`]: formConfig,
      [`source.${type}.path`]: path,
      [`source.${type}.startLine`]: startLine,
      [`source.${type}.endLine`]: endLine,
    },
  });
};
