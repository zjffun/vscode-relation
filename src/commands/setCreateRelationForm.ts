import { RelationFormWebview } from "../views/RelationFormWebview";

export default async ({ type, path }: { type: string; path: string }) => {
  const { getInfo, createRelation } = await new Function(
    `return new Promise((res) => res(import("relation2")))`
  )();

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
