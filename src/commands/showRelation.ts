import { IRelation, IRelationContainer } from "..";
import { context } from "../share";
import { RelationWebview } from "../views/RelationWebview";

export const showRelationCommandId = "_vscode-relation._showRelation";

export default async (relation: IRelationContainer | IRelation) => {
  new RelationWebview(context, relation);
};
