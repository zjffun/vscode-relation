import { CreateRelationsWebview } from "../views/CreateRelationsWebview";

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
  const createRelationsWebview = CreateRelationsWebview.singleton();

  createRelationsWebview.reveal();
  let formConfig = "file";

  if (startLine) {
    formConfig = "fileLine";
  }

  createRelationsWebview.postMessage({
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
