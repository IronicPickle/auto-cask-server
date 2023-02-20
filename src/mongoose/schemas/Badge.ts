import { model, Schema } from "mongoose";

const schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  breweryName: {
    type: String,
    required: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  createdOn: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
});

export const Badge = model("Badge", schema);
