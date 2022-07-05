import { IRelation } from "..";
import { context } from "../share";
import { RelationWebview } from "../views/RelationWebview";

export default async (relation: IRelation) => {
  new RelationWebview(context, relation);
};
