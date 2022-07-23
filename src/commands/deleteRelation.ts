import { IRelation, IRelationContainer } from "..";
import { context } from "../share";
import { RelationWebview } from "../views/RelationWebview";

export const deleteRelationCommandId = "_vscode-relation._deleteRelation";

export default async (relation: IRelationContainer | IRelation) => {
  // TODO: delete
  console.log(relation);
};
