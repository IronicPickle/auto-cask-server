import { model, Schema } from "mongoose";

const schema = new Schema({
  organisation: {
    type: Schema.Types.ObjectId,
    ref: "Organisation",
    required: true,
  },
  pumpClient: {
    type: Schema.Types.ObjectId,
    ref: "PumpClient",
    required: true,
  },
  name: {
    type: String,
    required: true,
    index: true,
  },
  createdOn: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
  },
});

export const OrganisationPump = model("OrganisationPump", schema, "organisationPumps");
