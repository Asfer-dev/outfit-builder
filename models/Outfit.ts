// models/Outfit.ts
import { Schema, model, models } from "mongoose";

const outfitSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    name: String,
    items: [
      {
        category: String,
        imageUrl: String,
        name: String,
      },
    ],
  },
  { timestamps: true }
);

export const Outfit = models.Outfit || model("Outfit", outfitSchema);
