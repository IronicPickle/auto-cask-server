import { model, Schema } from "mongoose";

const schema = new Schema({
  mac: {
    type: String,
    required: true,
  },
  accessToken: {
    type: String,
    required: true,
  },
  fingerprintedUsers: {
    type: [Schema.Types.ObjectId],
    ref: "User",
    required: true,
    default: [],
  },

  createdOn: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
});

export const PumpClient = model("PumpClient", schema, "pumpClients");
