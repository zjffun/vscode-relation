import { RelationFormWebview } from "../views/RelationFormWebview";

export default async ({ type, path }: { type: string; path: string }) => {
  const relationFormWebview = RelationFormWebview.singleton();

  relationFormWebview.reveal();

  relationFormWebview.postMessage({
    type: "setFormData",
    payload: {
      operationType: "create",
      [`source.${type}.formConfig`]: "file",
      [`source.${type}.path`]: path,
    },
  });
};
