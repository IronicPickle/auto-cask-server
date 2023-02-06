import { model, Schema } from "mongoose";

const schema = new Schema({
  email: {
    type: String,
    required: true,
    index: true,
    unique: true,
  },
  displayName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdOn: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
});

export const User = model("User", schema);
