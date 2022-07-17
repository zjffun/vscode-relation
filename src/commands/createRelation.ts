import { RelationFormWebview } from "../views/RelationFormWebview";

export default async () => {
  const relationFormWebview = RelationFormWebview.singleton();
  relationFormWebview.reveal();
  return true;
};
