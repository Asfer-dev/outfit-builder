// models/WardrobeItem.ts
import { Schema, model, models } from "mongoose";

const wardrobeItemSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    category: { type: String, required: true }, // "Top" | "Bottom" | ...
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

export const WardrobeItem =
  models.WardrobeItem || model("WardrobeItem", wardrobeItemSchema);
