// types.ts
export type Category = "Top" | "Bottom" | "Shoes" | "Hijab" | "Accessory";

export interface OutfitItem {
  id: string;
  name: string;
  category: Category;
  imageUrl: string;
}

export type OutfitSelection = {
  [K in Category]?: OutfitItem;
};
