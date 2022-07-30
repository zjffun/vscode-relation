import { RelationFormWebview } from "../views/RelationFormWebview";

export const createRelationCommandId = "_vscode-relation._createRelation";

export default async () => {
  const relationFormWebview = RelationFormWebview.singleton();
  relationFormWebview.reveal();
  return true;
};
