// models/User.ts
import { Schema, model, models } from "mongoose";

const userSchema = new Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
});

export const User = models.User || model("User", userSchema);
