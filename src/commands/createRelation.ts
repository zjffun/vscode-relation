import { CreateRelationsWebview } from "../views/CreateRelationsWebview";

export const createRelationCommandId = "_vscode-relation._createRelation";

export default async () => {
  const createRelationsWebview = CreateRelationsWebview.singleton();
  createRelationsWebview.reveal();
  return true;
};
